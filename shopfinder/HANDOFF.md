# ShopFinder - handoff / continue here

Single source of truth for picking this project back up in a new (local) Claude Code session.
Read this together with `README.md`.

## Kickoff prompt (paste into a new `claude` session opened in ~/Desktop/sho)

> I'm continuing a project called ShopFinder, which lives in the `shopfinder/` folder of this
> repo. Read `shopfinder/HANDOFF.md` and `shopfinder/README.md` for full context, then give me
> a short summary of the current state and the next steps you recommend. The app is already
> built and running locally (15 tests passing, dashboard at http://localhost:5173). Going
> forward, for each change use this loop: implement -> `npm test` + `npm run build` ->
> `/code-review` -> commit. Use Plan mode (Shift+Tab) for anything non-trivial and ask me to
> approve before executing.

## What ShopFinder is

A personal Shopify-store discovery dashboard (brandsearch-style). Find Shopify stores and
filter by creation date, language, shipping country, niche, country of origin, currency, and
product count. Data comes 100% from Apify actors -> local SQLite -> Hono API -> React UI.

## Current status (DONE)

- MVP complete and verified: **15/15 tests passing**.
- Branch: `claude/gracious-thompson-stroxf` (pushed to GitHub `EminKolac/moltbot`).
- Stack: TypeScript/ESM (Node 22+), better-sqlite3, Hono API, Vite + React UI. Uses **npm** (not pnpm).
- Self-contained: decoupled from the surrounding moltbot repo (own package.json, not in the workspace).

## Layout (inside shopfinder/)

- `src/` - server, ingest, DB
  - `src/db.ts` - SQLite schema + filter/facet queries
  - `src/ingest.ts` - Apify ingest pipeline (token rotation pool)
  - `src/apify.ts` - Apify REST client
  - `src/server.ts` - Hono API (filters, facets, pagination)
- `web/` - Vite + React dashboard (filter sidebar, store grid, detail drawer)
- `data/sample-items.json` - 6 offline sample stores (tracked, no tokens needed)
- `test/` - 15 vitest tests (map / query / ui)

## Run it

```bash
cd shopfinder
npm install
npm run ingest -- --file data/sample-items.json   # seed offline samples (no tokens)
npm run dev                                        # API :8787 + UI :5173 -> open localhost:5173
npm test                                           # 15 passing
npm run build                                      # production bundle
```

## Live data (optional)

`.env` is gitignored. To pull real stores:
```bash
cp .env.example .env
# put ROTATED Apify tokens into APIFY_TOKENS=tok1,tok2,...
npm run ingest -- --terms "organic coffee,yoga mats" --max 25   # --country US biases origin
```
Primary actor: `apivault_labs/shopify-store-analyzer` (discover_and_analyze mode).

## Local workflow

- Edit via `claude`; `npm run dev` hot-reloads the browser so you see changes live.
- Review with the built-in `/code-review` (and `/security-review`) - no external tools needed.
- Plan mode: `Shift+Tab` to cycle into it; approve before execution.
- Commit/push normally - you own this branch.

## Roadmap / next ideas (deferred)

- Scheduled auto-refresh of ingested stores.
- `/products.json` enrichment for deeper product data.
- Revenue/traffic charts; more sorting + filters; saved searches.
- Optional later: SQLite -> Postgres if it grows; auth if hosted.

## Constraints

- Use **npm** inside shopfinder/ (not pnpm); keep it decoupled from moltbot's build/lint/test.
- Never commit `.env` or real tokens. Treat the tokens shared earlier as exposed -> rotate them.
