# Current Work

**Last updated: 2026-09-09** (branch `instagram-embed`, HEAD `0d1ec45`)

> Refresh this file when a branch merges or a gap closes. A quick way to check
> whether it's stale: `git log --oneline origin/main..HEAD` and
> `grep -rn "TODO" app lib`.

## In flight

### Boundary drawing map — on `main`

Merged as `Interactive map (#15)`, and present in this branch.

Adds `/map` (moved from `/boundary` in `42532b4`), `components/BoundaryMap.tsx`,
`app/api/boundary/route.ts`, and extracts shared validation into
`lib/validation.ts`.

Submissions are stored in **Neon** — the repo's first and only database. The
write is `insertBoundary()` in `lib/db.ts`; the schema is `db/schema.sql`, one
`boundary_submissions` table, applied by hand (there is no migration tool). The
Qomon upsert still happens afterwards, but it is now best-effort: a Qomon
failure is logged and the submission still succeeds.

Before it can ship:

- **`DATABASE_URL` must be set in the *production* environment**, and
  `npm run db:schema` run against that database. This is the one env var that
  does not fail soft — without it the page renders fine and then 500s on submit,
  losing the drawn boundary. Local `.env` is set and the schema is applied
  (verified 2026-09-06: table, both indexes and both check constraints present,
  round-trip insert confirmed).
- ~~`/map` has no nav link.~~ Done: it sits in `navLinks`
  (`app/layout.tsx:17`) as "Easton Map".
- ~~Nothing reads the table back.~~ Done: `/map` now has a "Submissions so far"
  section overlaying every submitted boundary, fed by
  `GET /api/boundary/geojson`. Geometry only — no name or email leaves the
  database. Overlapping fills darken where people agree, so it doubles as a
  consensus map once there is volume.
- **A DB failure is opaque to the resident.** `app/api/boundary/route.ts:149`
  turns any throw into a generic "Server error", so a misconfigured database
  looks identical to a bad request and the drawing is gone. Worth a distinct
  message before this is promoted widely.
- ~~`package-lock.json` doesn't include the Leaflet stack.~~ Done: the
  lockfile carries `leaflet`, `@geoman-io/leaflet-geoman-free`,
  `@types/leaflet` and `@neondatabase/serverless`, and `npm ci` installs
  cleanly (verified 2026-09-09).
- **`QOMON_BOUNDARY_FIELD_ID` is optional** and unset. Without it submissions
  still land in Neon and the contact is still upserted, just without the marker
  field. It needs a paid Qomon tier.
- **A Qomon failure now loses the contact details for good,** since they are no
  longer written to Neon as well. The route returns success with a `warning`
  the form displays — the boundary is saved, so a resubmit would only duplicate
  the geometry — but nobody is alerted. Worth a look if submissions matter.

### Instagram strip — on this branch, unmerged to `main`

`lib/instagram.ts`, `components/InstagramStrip.tsx`, a `SHOW_INSTAGRAM` feature
flag, and the `.igStrip` rules in `app/globals.css`. It pulls posts from
**Behold** (a hosted Instagram feed service) via a `BEHOLD_FEED_URL` env var and
renders full-bleed three-post strips as section dividers on the home, press,
proposal and rationale pages. Hides itself if fewer than three posts come back.

Before it can ship:

- **`BEHOLD_FEED_URL` is documented but unset.** `.env.example` covers it;
  no environment supplies a value yet. `getInstagramPosts`
  (`lib/instagram.ts:41`) returns `[]` when it is missing — no error, no
  warning. Because the component renders `null` on fewer than three posts,
  every page looks correct with no strips on it at all, so a missing URL is
  easily mistaken for a working feed.

## Known gaps

### Data protection — the significant one

`app/api/signup/route.ts:106` ends with a bare `// TODO GDPR CHECKS`.

The site collects **name, email, and phone** from residents and sends
them to a third-party CRM. There is currently no consent checkbox, no privacy
notice, no stated retention period and no opt-out path. Worth resolving before
any further promotion of the signup form.

`/map` deliberately does **not** widen this. `boundary_submissions` holds
geometry only; the submitter's name and email go to Qomon on the same payload
shape the signup form uses, so there is still exactly one store of personal
data. The polygons are anonymous and cannot be traced back to a person, which
is also why they can be displayed publicly.

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

- `docs/` was untracked when these were written; they were committed in `ce51fac`.
- The boundary and Instagram sections will need revisiting once those branches
  merge.
