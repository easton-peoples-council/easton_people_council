# Decisions

Why the code looks the way it does. Each entry is *decision → why → what it costs*.

Where a decision was made in a specific commit, the commit is named.

---

## No database

**Decision.** The app owns no persistent state. Qomon is the system of record for
people, DatoCMS for press articles, an iCal feed for events.

**Why.** A volunteer-run campaign site that already pays for a CRM doesn't need a
second copy of its supporter list. Organisers work in Qomon (TODO find an alternative CRM) daily; a separate
database would go stale and create a data-protection surface nobody is watching.

**Consequences.**
- No migrations, no ORM, no schema, no local database to run.
- But: **no local data either.** Exercising any form end to end needs live API
  credentials. There is no offline or fixture mode.
- Deployment is a static-ish Next build with no stateful dependency.
- Every read is a network call, which is why pages that show live counts use incremental static regeneration (ISR).

---

## Qomon `upsert` rather than `create`

**Decision.** Both write routes call `POST /contacts/upsert`.

**Why.** Someone who signs up and later submits a boundary is one person. Upsert
lets Qomon reconcile them on email rather than the site tracking identity.

**Consequence.** The two features share a contact record and neither has to know
about the other. Also means a resubmission quietly overwrites rather than
duplicating — acceptable here, but it does mean a typo'd email creates a second
contact with no way to merge from this side.

---

## Boundary rings stored as a JSON string in a Qomon custom field

**Decision.** The drawn polygon is `JSON.stringify`'d into one custom field on the
contact, rather than going to PostGIS, a GeoJSON file, or any geo store.

**Why.** Follows directly from "no database" — and it keeps a person's boundary
attached to the person, where organisers will actually look at it.

**Consequences.**
- **Coordinates rounded to 5dp** (~1 metre) so the string stays short enough for
  the field. Documented in a comment at `app/api/boundary/route.ts:43`.
- **200-vertex cap** for the same reason.
- Aggregating all submitted boundaries into a heat map means exporting from Qomon
  and parsing the strings — there is no query path for it.

---

## Server-side bounding-box validation

**Decision.** `parseRing()` rejects any vertex outside `BRISTOL_BBOX`.

**Why.** `/api/boundary` is an unauthenticated public endpoint that writes to the
CRM. Without a geographic constraint it accepts arbitrary geometry, and a
boundary drawn around Manchester is not a proposal for Easton's boundary

**Consequence.** The box is generous (all of Bristol) so it catches nonsense
rather than policing where Easton is. That judgement is deliberately left to
residents.

---

## Cloudflare Turnstile rather than a captcha or rate limiting

**Decision.** Both forms carry a Turnstile widget; both endpoints verify the token
server-side before writing. Added in `5c7daa1 Cloudflare (#7)`.

**Why.** The endpoints are unauthenticated and write to a CRM the campaign pays
for. Turnstile is free, needs no user interaction in the common case, and doesn't
require storing state — which rules out most rate-limiting approaches given there
is no database.

**Consequences.**
- Two more env vars, and a hard dependency on Cloudflare being up.
- Without the keys, forms disable themselves rather than falling back to unguarded
  submission — a deliberate fail-closed choice on the write path, in contrast to
  everything else, which fails soft.

---

## Calendar is a hand-rolled list

**Decision.** `components/Calendar.tsx` renders a plain `<ul>`.

**Why.** The site shows at most three upcoming events in a vertical list. 

**Consequences.**
- **The three `@fullcalendar/*` packages were never removed from `package.json`,** TODO
  and orphaned `.fc-*` rules survive at `app/globals.css:546-566`. Tracked as
  cleanup in [current-work.md](current-work.md).

---

## Filtering events on the client, not in the route

**Decision.** `/api/events` returns the whole feed; `cleanAndSortEvents()` applies
the today-onwards filter and three-event cap in the browser
(`c000f52 calendar only showing forwards (#12)`).

**Why.** The route is cached with `revalidate = 600`. Filtering by "today" inside
a cached response would bake yesterday's cutoff into the cache and show stale past
events for up to ten minutes.

**Consequence.** The client does slightly more work and receives events it throws
away, in exchange for the cutoff always being correct.

---

## `node-ical` pinned to the Node runtime

**Decision.** `app/api/events/route.ts` sets `runtime = 'nodejs'`, and
`next.config.js` lists `node-ical` under `serverComponentsExternalPackages`
(`154b992 nodejs runtime`).

**Why.** `node-ical` uses Node built-ins and cannot run on the Edge runtime.

**Consequence.** Both settings are load-bearing. Removing either breaks the
calendar at build or request time, and the failure is soft — the calendar just
goes empty — so it's easy to miss.

---

## Plain global CSS with custom-property tokens

**Decision.** One `app/globals.css` (~657 lines), design tokens as CSS custom
properties at the top, four self-hosted fonts. No Tailwind, no CSS modules, no
styled-components.

**Why.** A small site with a bespoke visual identity and contributors who may not
be full-time developers. Plain CSS has no build step, no class-name conventions to
learn, and keeps the fonts and colours in one readable place.

**Consequence.** No style scoping — class names are globally unique by convention
only. Fonts are self-hosted with their licence files committed alongside.

---

## `SHOW_PETITION` feature flag instead of deleting the page

**Decision.** `lib/feature-flags.ts` exports a single `SHOW_PETITION = false`. It
removes the nav link *and* makes `/petition` redirect to `/`
(`5274523 petition page hidden`).

**Why.** The petition is a real future step in the campaign (step 1 of the legal
path — see [domain.md](domain.md)), not an abandoned idea. Keeping the route
means turning it on is a one-line change.

**Consequence.** Both the link and the route must be gated — hiding only the link
would leave the placeholder publicly reachable. Any future flag should follow the
same both-ends pattern.

---

## ISR at 600 seconds

**Decision.** Pages reading live data set `export const revalidate = 600`.

**Why.** The supporter count changes slowly, and every render otherwise costs a
full Qomon contact search across four pages.

**Consequence.** A new signup takes up to ten minutes to move the counter. Fine
for the campaign; worth knowing before debugging a "stuck" number.

---

## Rejected and deferred

- **A secret-guarded preview route.** `lib/datocms.ts:28` sketches gating
  `?preview=1` behind a secret or cookie. It was never built, so **anyone can read
  unpublished DatoCMS drafts** by adding the query parameter. Listed as a gap in
  [current-work.md](current-work.md).
- **Qomon tagging on signup.** `tags: ["website-signup"]` sits commented out at
  `app/api/signup/route.ts:82`, pending clarification of what Qomon tags mean
  operationally. Deferred rather than guessed at.
- **Sending the signup comment to Qomon.** Commented out at
  `app/api/signup/route.ts:80` alongside a note about updating existing contacts
  on match. The field is still collected and validated in the meantime.
- **A `/api/contacts` endpoint.** Existed earlier in history, returning
  `{ contacts: <count> }`. Removed once server components could call
  `getContactsCountOrNull()` directly — a client round-trip for a number already
  available at render time.
