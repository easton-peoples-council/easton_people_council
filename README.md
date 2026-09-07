# A People's Council for Easton

The campaign website for a resident-led effort to establish a **People's Council**
(a UK parish/community council) for Easton, Bristol.

The project isn't backed by organisations, funders or political parties — it's a
group of locals starting a conversation, and this site is how that conversation
reaches people.

**Live site:** eastoncommunitycouncil.uk · **Instagram:** [@eastonpeoplescouncil](https://www.instagram.com/eastonpeoplescouncil/) · **Donate:** [Open Collective](https://opencollective.com/easton-peoples-council-campaig)

## What the site does

1. **Explains the campaign** — static pages at `/rationale`, `/proposal` and a
   DatoCMS-backed press page at `/press`.
2. **Collects supporters** — a signup form that pushes contacts into Qomon (the
   campaign CRM) and shows a live "N people have already signed up!" counter.
3. **Shows upcoming events** — pulls an iCal feed and renders the next three.
4. **Crowdsources the boundary** — at `/boundary`, residents draw the polygon they
   consider "Easton" on a map. The answers will shape the boundary in the proposal
   to Bristol City Council.

There is **no database**. Everything is delegated to third-party APIs — Qomon holds
the people, DatoCMS holds the press articles, an iCal feed holds the events.

## Quick start

```bash
npm install          # NOT npm ci — see docs/development.md
cp .env.example .env # then fill in the values
npm run dev          # http://localhost:3000
```

The static pages work without any credentials. The forms, calendar, press page and
supporter counter each need their own key — `.env.example` says which.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · plain CSS ·
Leaflet + Geoman for the map · Cloudflare Turnstile for bot protection

## Documentation

| File | What's in it |
|---|---|
| [docs/architecture.md](docs/architecture.md) | How the pieces fit — request flows, API surface, external services, data shapes |
| [docs/domain.md](docs/domain.md) | What a People's Council is, the legal path to creating one, glossary, and the business rules buried in the code |
| [docs/decisions.md](docs/decisions.md) | Why it's built this way — and what was tried and dropped |
| [docs/development.md](docs/development.md) | Setup, commands, project layout, git workflow, deployment |
| [docs/current-work.md](docs/current-work.md) | What's in flight right now, and the known gaps |

`CLAUDE.md` at the repo root is a short orientation file for AI coding agents.

## Contributing

Branch from `main`, keep the change small, open a PR. See
[docs/development.md](docs/development.md) for the details.
