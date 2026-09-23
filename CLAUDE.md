# CLAUDE.md

Orientation for AI coding agents. Fuller detail lives in [docs/](docs/).

## What this is

The campaign website for establishing a People's Council (UK parish council) in
Easton, Bristol. Next.js 14 App Router · React 18 · TypeScript strict · plain CSS.
~1,600 lines across ~21 source files.

## Commands

```bash
npm ci              # or npm install
npm run dev         # localhost:3000
npm run build
npm start
npm run db:schema   # apply db/schema.sql to DATABASE_URL (idempotent)
```

`npm run lint` is **declared but broken** — `eslint` and `eslint-config-next` are
not installed and there is no `.eslintrc.*`. Don't run it expecting a result. If
you add ESLint, Next 14 needs ESLint 8, not 9.

**There are no tests.** No runner, no test files, no CI. Verify changes by
building and loading the page.

## Layout

```
app/          App Router — pages, layout, and API routes under app/api/
components/   Shared components
lib/          Integrations and framework-free logic
public/       Logo, favicon, self-hosted fonts
```

No `src/`. Import alias `@/*` → `./*` (see tsconfig.json).

Note: presentational components live in **both** `app/` (SignupForm, HeaderNav,
HomeGetInTouchCta, GetInTouchSection) and `components/` (Calendar, BoundaryMap,
DonateButton). There is no stated rule separating them — follow whichever
directory the nearest similar component uses rather than trying to derive one.

## The thing to know first

**Almost nothing is stored here.** Qomon (`https://incoming.qomon.app`) is the
system of record for people; DatoCMS holds press articles; an iCal feed holds
events. Exercising a form end to end requires live API credentials.

The one exception is **Neon** (Postgres), which stores the polygons drawn on
`/map` and nothing else — `lib/db.ts`, schema in `db/schema.sql`. There is no
ORM and no migration tool: the schema file is idempotent and applied by hand
with `npm run db:schema` (psql is not a prerequisite).

**Neon holds no personal data.** Names and emails from the `/map` form go to
Qomon only, on the same payload shape `app/api/signup/route.ts` uses. Keep it
that way: the polygons are public at `GET /api/boundary/geojson`, and they are
publishable precisely because nothing links one to a person.

## Gotchas

- **Leaflet and Geoman touch `window` at module scope.** They must be dynamically
  `import()`ed inside `useEffect`, never at module level — see
  `components/BoundaryMap.tsx:42`.
- **`node-ical` cannot run on the Edge runtime.** `app/api/events/route.ts` pins
  `runtime = 'nodejs'` and `next.config.js` lists it in
  `serverComponentsExternalPackages`. Don't remove either.
- **`.env.development` is committed and overrides `.env` under `next dev`.** It
  carries Cloudflare's Turnstile test keys, because the real widget key rejects
  `localhost` with error 110200 and leaves the submit button dead. Both keys
  switch together; don't split them across files.
- **Nine env vars; eight fail soft.** A missing key degrades a feature silently
  rather than erroring — see `.env.example` for which does what. `DATABASE_URL`
  is the exception: without it `/map` 500s on submit and the drawn boundary,
  which exists nowhere else, is lost.
- **`@fullcalendar/*` is installed but unused.** The calendar is a hand-rolled
  `<ul>` in `components/Calendar.tsx`. Don't import FullCalendar.
- **`SHOW_PETITION` in `lib/feature-flags.ts` is `false`,** which both hides the
  nav link and makes `/petition` redirect to `/`.
- **`/map` is in the nav as "Easton Map",** but its route handler lives at
  `app/api/boundary/` — the page and its API are named differently.

## Conventions

- Server components fetch at render; pages that read live counts set
  `export const revalidate = 600`.
- Validation shared between routes goes in `lib/validation.ts`. Both form
  endpoints verify Turnstile server-side before writing anything.
- Styling is plain CSS in `app/globals.css` with custom-property tokens at the
  top. No Tailwind, no CSS modules.
- British English in user-facing copy.

## Before making changes

Read [docs/current-work.md](docs/current-work.md) — it lists what's unmerged and
the known gaps, including a `// TODO GDPR CHECKS` on the signup route that matters
if you touch anything handling personal data.
