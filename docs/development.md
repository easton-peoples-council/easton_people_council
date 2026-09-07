# Development Guide

## Prerequisites

- **Node.js 20+** (developed on v20.11.0; Next 14 needs 18.17 or newer)
- **npm** (v10 used here; `package-lock.json` is lockfileVersion 3)

The one database is Neon, which is hosted, so you connect to it rather than run it.

## Setup

```bash
git clone git@github.com:easton-peoples-council/easton_people_council.git
cd easton_people_council
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

If you are going to work on `/map`, also apply the database schema once — see
[Neon](#neon) below.

> **Use `npm install`, not `npm ci`.** `package-lock.json` is currently out of
> sync with `package.json` — it predates the Leaflet stack and contains no entry
> for `leaflet`, `@geoman-io/leaflet-geoman-free` or `@types/leaflet`. `npm ci`
> installs strictly from the lockfile, so `/map` will fail to build. Running
> `npm install` refreshes the lockfile; committing that refresh would be a
> welcome fix.

### Credentials

Every environment variable is documented in `.env.example`. Seven of the eight
fail soft — a missing key silently degrades one feature rather than crashing the
app, which makes them easy to overlook. `DATABASE_URL` is the exception.

**Works with no credentials at all:** `/`, `/rationale`, `/proposal` — all the
static copy, layout, fonts and styling.

| Needs a key | To work on |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Either form. Handled locally by `.env.development` — see [Turnstile](#turnstile) |
| `QOMON_API_KEY` | Signup submission, and the supporter counter on four pages |
| `DATABASE_URL` | `/map` submission — the map renders fine without it, then 500s on submit |
| `QOMON_BOUNDARY_FIELD_ID` | Optional. Tags the Qomon contact of someone who drew a boundary |
| `CALENDAR_URL` | The homepage calendar |
| `DATOCMS_API_TOKEN` | `/press` article list |
| `DATOCMS_PREVIEW_TOKEN` | `/press?preview=1` draft mode (optional) |

Ask an existing maintainer for values — several are shared campaign accounts.

`QOMON_BOUNDARY_FIELD_ID` and `DATOCMS_PREVIEW_TOKEN` are read by the code but
are optional and unset locally; both degrade quietly. `DATABASE_URL` does not —
if `/map` returns "Server error" on submit, check that first, then check that
`db/schema.sql` has actually been applied to the database you pointed it at.

## Turnstile

Both forms gate submission on a Turnstile token, so a broken widget shows up as
a permanently disabled submit button.

**This is already handled — there is nothing to configure.** `.env.development`
is committed, holds Cloudflare's test keys, and `next dev` loads it in
preference to `.env`:

```
next dev    →  .env.development, .env   →  test keys
next build  →  .env                     →  real keys
```

Keep the real keys in `.env` permanently and never swap them by hand.

Why it's needed: the campaign's real widget key only works on the hostnames
registered against it in the Turnstile dashboard, and `localhost` is not one of
them. The failure is quiet — the widget mounts, Cloudflare rejects the hostname
with error `110200`, the error callback clears the token, and the submit button
never enables.

Why an env file rather than a check in the code: the site key and secret must be
a **matched pair**. Client code can only test the hostname while the server
tests `NODE_ENV`, and those disagree under `npm start` on localhost — the
browser would solve a test challenge that the server then rejects with the real
secret. Loading both from one env file makes a mismatch impossible.

**Caveat:** `npm run build && npm start` is production mode, so it uses the real
keys and the forms will hit `110200` on localhost. If you need to smoke-test a
production build locally, put the test keys in `.env.local` (gitignored, wins in
both modes). Never set test keys in the real production environment — Turnstile
becomes a no-op and both forms lose bot protection entirely.

`components/BoundaryMap.tsx` renders its widget imperatively via
`turnstile.render()` and now surfaces the error code on the page and in the
console, so a repeat of the above should diagnose itself. `app/SignupForm.tsx`
uses the declarative `.cf-turnstile` auto-render path instead; the two differ
for the reason given in the comment above `renderTurnstile`.

## Neon

The only database. It stores one thing: the polygons residents draw on `/map`.
Everything else in the app is stateless.

- **Driver:** `@neondatabase/serverless` over HTTP, wrapped in `lib/db.ts`. No
  pool and no ORM — one tagged-template insert.
- **Schema:** `db/schema.sql`, a single `boundary_submissions` table. There is no
  migration tool; the file is idempotent and re-running it is the update path.

Apply it to a fresh database:

```bash
npm run db:schema
```

That runs `db/apply-schema.mjs`, which reads `.env`, splits `schema.sql` into
statements and sends them as one transaction over the Neon HTTP driver already
in `node_modules` — so **psql is not a prerequisite** (it isn't installed on a
default WSL/Ubuntu box). Pasting the file into the Neon console's SQL Editor
works too.

Use the **pooled** connection string (its host contains `-pooler`). Neon's
console hands it to you already double-quoted; leave the quotes on — dotenv
strips them, and so does `apply-schema.mjs`. Neon scales
compute to zero when idle, so the first request after a quiet period pays a
cold-start of a second or two — that is expected, not a bug.

Reading submissions back, until there is a UI for it:

```sql
select id, created_at, name, email, point_count
from boundary_submissions
order by created_at desc
limit 50;
```

**The table holds no personal data.** Columns are `id`, `geometry`,
`point_count`, `created_at` — nothing that identifies who drew a polygon. A
submitter's name and email go to Qomon and nowhere else, which is why
`GET /api/boundary/geojson` can be public with no filtering to get wrong.

`name` and `email` were columns here originally. The drops at the end of
`schema.sql` are the migration; they are no-ops on a fresh database.

Read back by `listBoundaries()` in `lib/db.ts` → `GET /api/boundary/geojson` →
`components/BoundarySubmissions.tsx`, which renders the "Submissions so far"
heatmap and list on `/map`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build — the only real check this repo has |
| `npm start` | Serve a production build |
| `npm run db:schema` | Apply `db/schema.sql` to `DATABASE_URL`. Idempotent |
| `npm run lint` | **Broken.** See below |

### `npm run lint` does not work

The script is declared as `next lint`, but neither `eslint` nor
`eslint-config-next` is in `devDependencies` or `node_modules`, and there is no
`.eslintrc.*` anywhere in the working tree. The command will fail.

To fix it, pin ESLint 8 — **not 9.** Next 14's `next lint` is incompatible with
ESLint 9, and `eslint-config-next` v16+ breaks it too:

```bash
npm install --save-dev eslint@8 eslint-config-next@14
```

then add `.eslintrc.json` containing `{ "extends": "next/core-web-vitals" }`.

Until then, `npm run build` (which runs `tsc` in strict mode) is the only
automated check on a change.

## Project structure

```
app/                      # App Router — no src/ directory
  layout.tsx              # Root shell: <html>, header + logo, nav, footer + donate
  globals.css             # ALL styling: @font-face x4, :root tokens, every class
  page.tsx                # "/" homepage — async server component, ISR 600s
  HeaderNav.tsx           # client — nav with active state via usePathname
  SignupForm.tsx          # client — main signup form + Turnstile widget
  HomeGetInTouchCta.tsx   # server — "N people signed up" + CTA button
  GetInTouchSection.tsx   # server — reusable <section> around the CTA
  rationale/page.tsx      # "/rationale"  (in nav)
  proposal/page.tsx       # "/proposal"   (in nav)
  press/page.tsx          # "/press"      (in nav) — DatoCMS + ?preview=1
  petition/page.tsx       # "/petition"   — redirects to "/" while SHOW_PETITION is false
  map/page.tsx            # "/map"        — NOT in the nav, direct URL only
  api/
    signup/route.ts       # POST — validate → Turnstile → Qomon upsert
    events/route.ts       # GET  — fetch + parse the iCal feed
    boundary/route.ts     # POST — validate polygon → Turnstile → Neon insert → Qomon upsert
    boundary/geojson/route.ts  # GET — submitted boundaries as GeoJSON (geometry only)

components/               # shared components, outside the route tree
  Calendar.tsx            # client — fetches /api/events, renders next 3
  BoundaryMap.tsx         # client — Leaflet + Geoman, dynamic import, submit form
  BoundarySubmissions.tsx # client — read-only heatmap + list of every submission
  DonateButton.tsx        # client — window.open → Open Collective

lib/                      # framework-free logic and integrations
  qomon.ts                # HTTP wrapper + getContactsCount()
  datocms.ts              # published + preview GraphQL clients (good docblock)
  events.ts               # CalendarEvent types + cleanAndSortEvents()
  validation.ts           # EMAIL_REGEX, UK_PHONE_LOOSE_REGEX, verifyTurnstileToken()
  feature-flags.ts        # SHOW_PETITION
  db.ts                   # Neon client + insertBoundary() / listBoundaries()
  boundaries.ts           # pure geometry — pointInRing, ringAreaKm2, buildCoverage

db/
  schema.sql              # the whole Postgres schema — idempotent, applied by hand
  apply-schema.mjs        # `npm run db:schema` — applies it without needing psql
public/                   # logo.png, favicon.png, fonts/
docs/                     # this documentation
```

### `app/` vs `components/`

Some presentational components live in `app/` (`SignupForm`, `HeaderNav`,
`HomeGetInTouchCta`, `GetInTouchSection`) and others in `components/`
(`Calendar`, `BoundaryMap`, `DonateButton`). **There is no rule distinguishing
them** — it's historical. Don't spend time deriving one; put a new component
wherever the most similar existing component lives.

### Conventions

- Import alias `@/*` → `./*`, so `@/lib/qomon` from anywhere.
- TypeScript `strict: true`. The build will not pass on an implicit `any`.
- Server components by default; `"use client"` only where state, effects or
  browser APIs are genuinely needed.
- Shared validation goes in `lib/validation.ts` so both routes stay consistent.
- User-facing copy is British English with typographic apostrophes (`’`).

## Testing

**There are no tests** — no runner, no test files, no CI. Changes are verified by
running the build and loading the page.

If you're adding the first tests, the two obvious targets are pure functions with
real logic and no I/O:

- `lib/boundaries.ts` — the best starting point in the repo. Three pure
  functions with real logic, no I/O and obvious expected values:
  `pointInRing()` (inside, outside, and a point beyond the ring's latitude
  range), `ringAreaKm2()` (a 0.02° × 0.01° box at Bristol's latitude is
  ~1.54 km²), and `buildCoverage()` (two overlapping squares must produce a
  cell with `count === 2`, and `maxCount === 2`).
- `cleanAndSortEvents()` in `lib/events.ts` — `[In-person]` stripping, the
  today-onwards cutoff, the three-event cap, empty-title fallback.
- `parseRing()` in `app/api/boundary/route.ts` — vertex count bounds, the bbox
  check, 5dp rounding, malformed input.

## Git workflow

As actually practised in this repo:

- Branch from `main`, one short-lived branch per change.
- Small PRs, squash-merged into `main`.
- Branches aren't deleted after merge — hence the long `git branch -a` list. Most
  remote branches are merged or stale; check against `main` before assuming a
  branch is live work.
- Never commit secrets. `.env` is gitignored; `.env.example` holds keys only.
- Run `npm run build` before opening a PR — it's the only check there is.

## Deployment

**No deployment configuration is committed to this repository.** There is no
`.github/`, no `vercel.json`, no `wrangler.toml`, no `netlify.toml` and no
`Dockerfile` on any branch. Hosting is configured through a provider dashboard.

The evidence points to **Vercel first, then Cloudflare**:

- Commit `5c7daa1 Cloudflare (#7)`, and branches `cloudflare`, `cloudflare-dev`,
  `deploy`.
- Both API routes read the `cf-connecting-ip` header first, which only exists
  behind Cloudflare.
- Earlier commits reference Vercel (`push for vercel's sake`, `test in vercel dev`).
- The custom domain appears to be `eastoncommunitycouncil.uk`.

> **Needs confirmation from the maintainer.** This section is inferred from commit
> history and code, not from any config file. Anyone who knows where production
> actually runs should replace this paragraph with the facts — including where the
> production environment variables are set.
