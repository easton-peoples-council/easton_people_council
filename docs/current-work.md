# Current Work

**Last updated: 2026-09-05** (branch `interactive-map`, HEAD `2a5155b`)

> Refresh this file when a branch merges or a gap closes. A quick way to check
> whether it's stale: `git log --oneline origin/main..HEAD` and
> `grep -rn "TODO" app lib`.

## In flight

### Boundary drawing map — unmerged

The newest feature, and the only commit ahead of `origin/main`
(`2a5155b Add boundary drawing map`, 7 files).

Adds `/boundary`, `components/BoundaryMap.tsx`, `app/api/boundary/route.ts`, and
extracts shared validation into `lib/validation.ts`.

Before it can ship:

- **`QOMON_BOUNDARY_FIELD_ID` must be set** in the production environment. The
  page renders fine without it and only fails on submit, with
  "Boundary submissions are not configured". It's also unset in the local `.env`.
- **`/boundary` has no nav link** — it isn't in `navLinks` (`app/layout.tsx:17`)
  and nothing links to it, so it's undiscoverable. Decide whether it belongs in
  the nav, is linked from the homepage, or stays a shareable direct URL.
- **`package-lock.json` doesn't include the Leaflet stack** (see below), so a
  build from the lockfile will fail.

### Instagram strip — unmerged, on `origin/instagram-embed`

That branch is this one plus 153 lines: `lib/instagram.ts`,
`components/InstagramStrip.tsx`, a `SHOW_INSTAGRAM` feature flag, and CSS. It
pulls posts from **Behold** (a hosted Instagram feed service) via a new
`BEHOLD_FEED_URL` env var and renders full-bleed three-post strips as section
dividers on the home, press, proposal and rationale pages. Hides itself if fewer
than three posts come back.

Same-day work as the boundary map. Since both branches share the boundary commit,
decide the merge order before either lands.

## Known gaps

### Data protection — the significant one

`app/api/signup/route.ts:106` ends with a bare `// TODO GDPR CHECKS`.

The site collects **name, email, and qa 1phone** from residents and sends
them to a third-party CRM. There is currently no consent checkbox, no privacy
notice, no stated retention period and no opt-out path. Worth resolving before
any further promotion of the signup form.

### Functional

- **The signup comment is discarded.** Users type it, the server validates it
  against `MAX_COMMENT_LENGTH`, and then it isn't included in the Qomon payload
  (`app/api/signup/route.ts:80`). People are giving feedback that nobody receives.
- **Client/server validation mismatch.** `app/SignupForm.tsx` marks email
  `required`, but the server accepts a name plus *any one* of email, phone or
  comment. The browser is stricter than the API.
- **The supporter counter caps at 1000.** `getContactsCount()` counts the array
  returned by a `per_page: 1000` search, so the number will quietly stop rising.
- **Only three events ever show**, with no "see all" link — a fourth upcoming
  event is invisible.

### Security

- **`/press?preview=1` is unauthenticated.** Anyone who guesses the query
  parameter can read unpublished DatoCMS drafts. `lib/datocms.ts:28` sketches a
  secret-guarded approach that was never implemented.

### Tooling and hygiene


- **`package-lock.json` is out of sync with `package.json`** — no entry for
  `leaflet`, `@geoman-io/leaflet-geoman-free` or `@types/leaflet`. Use
  `npm install`, not `npm ci`, and commit the refreshed lockfile.
- **No tests at all.** See [development.md](development.md#testing) for the two
  functions worth starting with.

### Content and assets

- `app/press/page.tsx:15` flags an unused `url_identifier` field on the DatoCMS
  `article` model; the query doesn't request it.
- The DatoCMS query fetches `images { url }` but the page never renders them.
- `/petition` is a placeholder behind `SHOW_PETITION = false`. Real future work —
  step 1 of the legal path in [domain.md](domain.md) — not an abandoned page.

## Documentation debt

- `docs/` is currently **untracked in git**. Nothing here is committed yet.
- These docs were written against `2a5155b`. The boundary and Instagram sections
  will need revisiting once those branches merge.
