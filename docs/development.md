# Development Guide

## Prerequisites

- **Node.js 20+** (developed on v20.11.0; Next 14 needs 18.17 or newer)
- **npm** (v10 used here; `package-lock.json` is lockfileVersion 3)

That's the whole list. No Python, no Docker, no AWS account, no database to run.

## Setup

```bash
git clone git@github.com:easton-peoples-council/easton_people_council.git
cd easton_people_council
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

> **Use `npm install`, not `npm ci`.** `package-lock.json` is currently out of
> sync with `package.json` — it predates the Leaflet stack and contains no entry
> for `leaflet`, `@geoman-io/leaflet-geoman-free` or `@types/leaflet`. `npm ci`
> installs strictly from the lockfile, so `/boundary` will fail to build. Running
> `npm install` refreshes the lockfile; committing that refresh would be a
> welcome fix.

### Credentials

Every environment variable is documented in `.env.example`. All seven fail soft —
a missing key silently degrades one feature rather than crashing the app, which
makes them easy to overlook.

**Works with no credentials at all:** `/`, `/rationale`, `/proposal` — all the
static copy, layout, fonts and styling.

| Needs a key | To work on |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Either form. Without them the submit button stays disabled |
| `QOMON_API_KEY` | Signup submission, and the supporter counter on four pages |
| `QOMON_BOUNDARY_FIELD_ID` | `/boundary` submission — the map renders fine without it, then 500s on submit |
| `CALENDAR_URL` | The homepage calendar |
| `DATOCMS_API_TOKEN` | `/press` article list |
| `DATOCMS_PREVIEW_TOKEN` | `/press?preview=1` draft mode (optional) |

Ask an existing maintainer for values — several are shared campaign accounts.

Note that `QOMON_BOUNDARY_FIELD_ID` and `DATOCMS_PREVIEW_TOKEN` are read by the
code but are **not** in the current local `.env`. If `/boundary` returns
"Boundary submissions are not configured", that's why.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build — the only real check this repo has |
| `npm start` | Serve a production build |
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
  boundary/page.tsx       # "/boundary"   — NOT in the nav, direct URL only
  api/
    signup/route.ts       # POST — validate → Turnstile → Qomon upsert
    events/route.ts       # GET  — fetch + parse the iCal feed
    boundary/route.ts     # POST — validate polygon → Turnstile → Qomon upsert

components/               # shared components, outside the route tree
  Calendar.tsx            # client — fetches /api/events, renders next 3
  BoundaryMap.tsx         # client — Leaflet + Geoman, dynamic import, submit form
  DonateButton.tsx        # client — window.open → Open Collective

lib/                      # framework-free logic and integrations
  qomon.ts                # HTTP wrapper + getContactsCount()
  datocms.ts              # published + preview GraphQL clients (good docblock)
  events.ts               # CalendarEvent types + cleanAndSortEvents()
  validation.ts           # EMAIL_REGEX, UK_PHONE_LOOSE_REGEX, verifyTurnstileToken()
  feature-flags.ts        # SHOW_PETITION

public/                   # logo.png, favicon.png, title.png (unused), fonts/
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
