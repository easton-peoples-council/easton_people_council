# Domain

Background and business rules that the code assumes but doesn't explain.

## What a People's Council is

A **parish council** (called a community council in Wales and Scotland, and a
"People's Council" by this campaign) is the most local tier of government in
England. It has legal standing, can raise money through a **precept** — a small
addition to council tax — and spends it locally on whatever residents choose.

Easton, a neighbourhood of Bristol, doesn't have one. This campaign is exploring
whether it should. Two things follow from that framing and shape the whole site:

- **It's exploratory, not settled.** The copy consistently says "explore whether"
  rather than promising an outcome. Keep that register when editing content.
- **It's resident-led.** Not backed by organisations, funders or political
  parties. Nothing on the site should imply institutional backing.

## How one actually gets created

From the FAQs at `app/proposal/page.tsx:33`:

1. A petition is created and signed by **at least 10% of local voters**.
2. The petition goes to **Bristol City Council**, which reviews the proposal.
3. Depending on the review, a **local referendum** may be held.
4. If a referendum happens and the majority vote in favour, the council is
   created, a clerk is appointed and elections are held — every four years by law.

This is why the site is built the way it is:

- **The supporter count matters** because step 1 is a numbers game. That's what
  the "N people have already signed up!" line is really tracking.
- **The boundary question exists** because a council needs a defined area, and
  nobody agrees where Easton begins and ends. `/boundary` crowdsources the answer
  so the proposal to Bristol City Council can be grounded in what residents
  actually think.

Indicative cost, also from the FAQs: from around **£2 per household per month**,
raising roughly £50k–£190k a year depending on the level chosen.

## Glossary

| Term | Meaning |
|---|---|
| **People's Council** | This campaign's name for a parish/community council for Easton |
| **Precept** | The portion of council tax a parish council raises for itself |
| **Qomon** | The campaign CRM at `incoming.qomon.app`. **The system of record for people** — every signup and boundary submission ends up here as a *contact* |
| **Contact** | A Qomon record for one person. Upserted, so the same email is never duplicated |
| **Custom field** | A user-defined field on a Qomon contact, addressed by numeric id. The boundary ring is stored in one |
| **DatoCMS** | Headless CMS holding press articles, queried over GraphQL |
| **DAST** | DatoCMS's structured-text document format — a JSON tree, not HTML |
| **Turnstile** | Cloudflare's captcha alternative. Guards both forms |
| **Boundary ring** | The polygon a resident draws: an array of `[lng, lat]` pairs |
| **`[In-person]`** | A marker the upstream calendar feed prefixes to event titles and descriptions. Stripped before display |
| **Behold** | Instagram feed service used on the unmerged `instagram-embed` branch |

## Rules that aren't obvious from the code

### Events

- **Only three events are ever shown**, and only from today onwards
  (`lib/events.ts:37-41`). There is no "see all" link, so a fourth event is
  invisible to users.
- The filter is **client-side**, not in the API route — `/api/events` returns the
  whole feed.
- **`[In-person]` is stripped** from both titles and descriptions before display.
- An event with no title becomes **"Event"** rather than rendering blank.
- Events with an unparseable start date are dropped silently.
- Times render in **24-hour en-GB format**.

### Boundaries

- **The polygon must be around Easton.** Every vertex has to fall inside
  `BRISTOL_BBOX` (`-2.75`–`-2.4` lng, `51.38`–`51.55` lat) or the submission is
  rejected with "The boundary must be drawn around Easton". This is a sanity
  check, not a precise Easton outline.
- **3–200 vertices.** Fewer isn't a polygon; more won't fit the storage.
- **Coordinates are rounded to 5 decimal places** (~1 metre). Deliberate: it keeps
  the JSON string short enough to sit in a Qomon custom field. Plenty of precision
  for a neighbourhood boundary.
- **One boundary per person.** Drawing a second polygon removes the first — the
  map enforces this on `pm:create`.
- The map opens centred on `EASTON_CENTRE = [51.4653, -2.562]` at zoom 14.
- Note the coordinate order: Leaflet gives `LatLng`, but the ring is stored
  **`[lng, lat]`** — GeoJSON order. Easy to get backwards.

### Contacts

- **The whole name goes into `firstname`**; `surname` is always sent as `""`.
  Nobody's name is split.
- Signup requires a name plus **at least one** of email, phone or comment. The
  browser form marks email required, so the server is more permissive than the UI.
- Boundary submission is stricter: **email is mandatory** and must match the regex.
- The comment a user types on the signup form is validated and then **discarded** —
  it is not sent to Qomon. See [current-work.md](current-work.md).

### The supporter count

- It is `contacts.length` from a Qomon search with `per_page: 1000`, so it
  **silently caps at 1000** and will simply stop rising after that.
- It costs a full contact search on every page render of `/`, `/rationale`,
  `/proposal` and `/press` — mitigated by 10-minute ISR.
- On failure it degrades to `null` and the line vanishes from the page rather than
  showing zero. A missing counter means an API problem, not zero supporters.

### Content

- **British English** throughout, and typographic apostrophes (`’`) in copy.
- The petition page exists but is switched off via `SHOW_PETITION`. It is a
  placeholder, not finished work that got hidden.
