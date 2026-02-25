# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 14 (App Router) community website for the Easton People's Council. It has no database, no external services, and no environment variables.

### Available scripts

See `package.json` for the full list. Key commands:

- `npm run dev` — start dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint via `next lint`

### Gotchas

- ESLint is not listed as a direct dependency in the original `package.json`. The dev dependencies `eslint` (v8) and `eslint-config-next` (v14) were added during setup along with `.eslintrc.json` (extends `next/core-web-vitals`). If `npm run lint` fails with "ESLint must be installed", run `npm install --save-dev eslint@8 eslint-config-next@14`.
- Next.js 14 requires ESLint 8, not ESLint 9. Installing the latest `eslint` or `eslint-config-next` (v16+) will break `next lint`.
- The `/api/signup` route validates input but does not persist data anywhere; it always returns `{ success: true }`.
- No `.env` files or secrets are required.
