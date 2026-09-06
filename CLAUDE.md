# CLAUDE.md

Orientation for AI coding agents. Fuller detail lives in [docs/](docs/).

## What this is

The campaign website for establishing a People's Council (UK parish council) in
Easton, Bristol. Next.js 14 App Router · React 18 · TypeScript strict · plain CSS.
~1,600 lines across ~21 source files.

## Commands

```bash
npm install    # NOT npm ci — package-lock.json is stale, missing the Leaflet stack
npm run dev    # localhost:3000
npm run build
npm start
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

**There is no database.** Qomon (`https://incoming.qomon.app`) is the system of
record for people; DatoCMS holds press articles; an iCal feed holds events. The
app owns no persistent state, so there is nothing to migrate and no local data —
exercising a form end to end requires live API credentials.

## Gotchas

- **Leaflet and Geoman touch `window` at module scope.** They must be dynamically
  `import()`ed inside `useEffect`, never at module level — see
  `components/BoundaryMap.tsx:42`.
- **`node-ical` cannot run on the Edge runtime.** `app/api/events/route.ts` pins
  `runtime = 'nodejs'` and `next.config.js` lists it in
  `serverComponentsExternalPackages`. Don't remove either.
- **Seven env vars, all fail soft.** A missing key degrades a feature silently
  rather than erroring — see `.env.example` for which does what.
- **`@fullcalendar/*` is installed but unused.** The calendar is a hand-rolled
  `<ul>` in `components/Calendar.tsx`. Don't import FullCalendar.
- **`SHOW_PETITION` in `lib/feature-flags.ts` is `false`,** which both hides the
  nav link and makes `/petition` redirect to `/`.
- **`/boundary` is not in the nav** and is reachable only by direct URL.

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
