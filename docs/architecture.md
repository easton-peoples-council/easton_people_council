# Architecture

A Next.js 14 App Router site with **no database and no backend of its own**. Every
piece of persistent state lives in a third-party service; the app is a rendering
and validation layer in front of them.

```
                      ┌─────────────────────────────┐
   browser ──────────▶│  Next.js 14 (App Router)    │
                      │                             │
                      │  app/*/page.tsx  (server)   │
                      │  app/api/*/route.ts         │
                      └──────┬──────────────────────┘
                             │
        ┌────────────────────┼────────────────────┬──────────────────┐
        ▼                    ▼                    ▼                  ▼
   Qomon CRM            DatoCMS              iCal feed        Cloudflare
   contacts +           press articles       events           Turnstile
   boundary rings       (GraphQL)            (node-ical)      (siteverify)
```

The browser also talks directly to **OpenStreetMap** (map tiles), **Cloudflare**
(the Turnstile widget script) and **Open Collective** (the donate popup).

## Shape

- App Router lives at the **repo root** — there is no `src/`.
- Pages are `async` server components that fetch at render time. Any page showing
  the live supporter count sets `export const revalidate = 600` (10-minute ISR).
- Three route handlers under `app/api/`. No middleware, no custom server, no
  `instrumentation.ts`.
- `lib/` holds framework-free logic and the API wrappers; it never imports from
  `app/` or `components/`.

| Directory | Contents |
|---|---|
| `app/` | Routes, root layout, global CSS, API handlers, and some components |
| `components/` | `Calendar`, `BoundaryMap`, `DonateButton` |
| `lib/` | `qomon.ts`, `datocms.ts`, `events.ts`, `validation.ts`, `feature-flags.ts` |
| `public/` | Logo, favicon, four self-hosted fonts + their licences |

Components are split across `app/` and `components/` with no stated rule — see
[development.md](development.md#project-structure).

## Request flows

### Signup

```
app/SignupForm.tsx  (client, "use client")
  └─ POST /api/signup  { name, email, phone, comment, turnstileToken }
       └─ app/api/signup/route.ts
            ├─ token present?  →  name present?  →  at least one of email/phone/comment?
            ├─ EMAIL_REGEX / UK_PHONE_LOOSE_REGEX / comment ≤ 2000   (lib/validation.ts)
            ├─ verifyTurnstileToken(token, remoteIp)  →  Cloudflare siteverify
            └─ qomonRequest('/contacts/upsert')       →  Qomon
```

Validation runs in that order and returns on the first failure, so the error the
user sees is the first rule they broke.

`remoteIp` is read from `cf-connecting-ip`, falling back to the first hop of
`x-forwarded-for`.

### Boundary submission

```
components/BoundaryMap.tsx  (client)
  ├─ dynamic import of leaflet + @geoman-io/leaflet-geoman-free inside useEffect
  ├─ user draws a polygon → pm:create → ring captured as [lng, lat][]
  └─ POST /api/boundary  { name, email, postcode?, boundary, turnstileToken }
       └─ app/api/boundary/route.ts
            ├─ parseRing()  →  3–200 vertices, all inside BRISTOL_BBOX, rounded to 5dp
            ├─ QOMON_BOUNDARY_FIELD_ID must be set, else 500
            ├─ verifyTurnstileToken(...)
            └─ qomonRequest('/contacts/upsert')  with custom_fields: [{ id, value }]
```

The ring is `JSON.stringify`'d into a single Qomon custom field. Stricter than
signup: email is mandatory here.

### Events

```
components/Calendar.tsx  (client)
  └─ GET /api/events
       └─ app/api/events/route.ts   runtime = 'nodejs', revalidate = 600
            └─ ical.async.fromURL(CALENDAR_URL)  →  filter VEVENT  →  CalendarEvent[]
  └─ cleanAndSortEvents()  (lib/events.ts)  ← filtering happens CLIENT-side
```

Note the split: the route returns **every** event in the feed; the today-onwards
filter and the three-event cap are applied in the browser.

### Press

```
app/press/page.tsx  (server)
  ├─ ?preview=1  →  datoPreviewClient  (drafts + published)
  └─ otherwise   →  datoClient         (published only)
       └─ ARTICLES_QUERY → https://graphql.datocms.com/
```

A GraphQL failure is caught and logged; the page renders with an empty list rather
than erroring.

### Supporter counter

`getContactsCountOrNull()` (`lib/qomon.ts`) is called directly from four server
components — `app/page.tsx`, `rationale`, `proposal` and `press` — and rendered by
`app/HomeGetInTouchCta.tsx`. On failure it returns `null` and the line is omitted.

## API surface

### Pages

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Hero, `#get-involved` signup, `#calendar`. ISR 600s |
| `/rationale` | `app/rationale/page.tsx` | In nav. Static copy + CTA |
| `/proposal` | `app/proposal/page.tsx` | In nav. Static copy + FAQs |
| `/press` | `app/press/page.tsx` | In nav. DatoCMS articles; `?preview=1` shows drafts |
| `/petition` | `app/petition/page.tsx` | **Hidden** — `SHOW_PETITION` is false, so it redirects to `/` |
| `/map` | `app/map/page.tsx` | In nav as "Easton Map". Draw-a-boundary form plus the `BoundarySubmissions` consensus view |

Nav is built in `app/layout.tsx:17`; active state is resolved client-side in
`app/HeaderNav.tsx`.

### Endpoints

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/api/signup` | `{ name, email, phone, comment, turnstileToken }` | `200 {success:true}` · `400 {error}` per rule · `500` on Qomon failure or throw · Turnstile propagates `400`/`500`/`502` |
| `POST` | `/api/boundary` | `{ name, email, postcode?, boundary: [lng,lat][], turnstileToken }` | `200 {success:true}` · `400 {error}` per rule · `500` if `QOMON_BOUNDARY_FIELD_ID` unset or Qomon fails |
| `GET` | `/api/events` | — | `200 CalendarEvent[]` · `503 []` if `CALENDAR_URL` unset/not http · `502 []` on fetch or parse failure |

`/api/events` **fails soft**: it never returns an error body, only an empty array
with a status code. The calendar therefore shows "No upcoming events" whether the
feed is empty, misconfigured or down.

## External services

| Service | Used by | Env var |
|---|---|---|
| **Qomon** `incoming.qomon.app` | `lib/qomon.ts` — `POST /contacts/upsert` (writes), `POST /search` (counter) | `QOMON_API_KEY`, `QOMON_BOUNDARY_FIELD_ID` |
| **DatoCMS** `graphql.datocms.com` | `lib/datocms.ts`, `app/press/page.tsx` | `DATOCMS_API_TOKEN`, `DATOCMS_PREVIEW_TOKEN` |
| **Cloudflare Turnstile** | `lib/validation.ts` + both forms | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| **iCal feed** | `app/api/events/route.ts` | `CALENDAR_URL` |
| **OpenStreetMap tiles** | `components/BoundaryMap.tsx` | none — no API key |
| **Open Collective** | `components/DonateButton.tsx` | none — popup link |

No auth provider, no email service, no storage bucket, no payment SDK, no analytics.

## Architectural constraints

- **`node-ical` cannot run on the Edge runtime.** `app/api/events/route.ts` pins
  `export const runtime = 'nodejs'` and `next.config.js` lists `node-ical` under
  `experimental.serverComponentsExternalPackages`. Both are load-bearing.
- **Leaflet and Geoman touch `window` at module scope**, so they are dynamically
  imported inside `useEffect` rather than at module level
  (`components/BoundaryMap.tsx:42`). A static import breaks the server render.
- **Turnstile is verified server-side on every write.** Client-side validation is
  duplicated for UX only and is never trusted.
- **The boundary ring must fit in one Qomon custom field**, which is what forces
  the 5-decimal-place rounding and the 200-vertex cap.

## Data shapes

There is no schema file anywhere in the repo, so this is the only written record
of the shapes the app moves around.

**`CalendarEvent`** — `lib/events.ts`

```ts
{ title: string; description: string; location: string; start: string; end: string }
```

`start`/`end` are ISO-8601. Derived from `IcalVEvent`, the minimal `VEVENT` shape
returned by `node-ical`.

**Qomon contact** — the de-facto primary entity, written by both POST routes

```ts
{
  kind: "contact",
  data: {
    firstname: string,        // the whole name goes here
    surname: "",              // always empty
    mail: string,
    phone?: string,
    address?: { postalcode: string },
    custom_fields?: [{ id: number, value: string }]   // boundary ring, JSON-encoded
  }
}
```

**`Ring`** — `app/api/boundary/route.ts`

```ts
type Ring = [number, number][]   // [lng, lat] pairs, 5dp, 3–200 of them
```

**DatoCMS `article`** — `app/press/page.tsx`

```ts
{ id, title, content: { value }, images: [{ url }], _publishedAt }
```

`content.value` is polymorphic — either a legacy HTML string or a DatoCMS DAST
structured-text document. Both branches are handled by `contentPreview()` and
`textFromDast()`. `images` is queried but never rendered.

**Relationships:** none. Contacts and articles live in separate systems and never
reference each other. The only join is conceptual — a signup and a boundary
submission from the same email address upsert onto the same Qomon contact.
