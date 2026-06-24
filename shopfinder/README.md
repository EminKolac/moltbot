# ShopFinder

A personal Shopify-store discovery dashboard, in the spirit of brandsearch.co.
Find Shopify stores and filter them by **creation date, language, shipping country,
niche, country of origin, currency, and product count**.

Data is pulled entirely from **Apify** actors (no self-crawling, no third-party login) and
stored in a local SQLite database, then served through a small Hono API to a React dashboard.

## How it works

```
Apify actor (apivault_labs/shopify-store-analyzer, discover_and_analyze)
   -> normalize -> SQLite (data/shopfinder.db) -> Hono API (/api) -> React dashboard
```

The primary actor is [`apivault_labs/shopify-store-analyzer`](https://apify.com/apivault_labs/shopify-store-analyzer)
(pay-per-use, ~$0.004/store). Its `discover_and_analyze` mode finds stores by keyword/niche and
returns the creation date (`oldest_product_date`), language (`locale`/`hreflangs`), shipping
markets (`markets`), niche (`primary_niche`), product count (`sitemap_products`), currency, and
traffic/revenue estimates — i.e. every filter the dashboard exposes.

## Setup

```bash
cd shopfinder
npm install
cp .env.example .env   # then paste your Apify token(s) into APIFY_TOKENS
```

## Pull some stores

```bash
# Discover + analyze stores for one or more niches/keywords
npm run ingest -- --terms "organic coffee,yoga mats" --max 25
# Optionally bias discovery to a country of origin
npm run ingest -- --terms "skincare" --country US --max 25
```

Each run logs how many stores were discovered, analyzed, and upserted, plus the approximate
Apify cost.

## Run the dashboard

```bash
npm run dev      # API on :8787, web on :5173 (Vite dev server, proxies /api)
# or, production-style:
npm run build && npm start   # serves the built dashboard + API on :8787
```

Open http://localhost:5173 (dev) or http://localhost:8787 (built) and filter away.

## Notes

- `.env` holds your Apify tokens and is gitignored. Never commit it.
- `markets` / shipping country and `oldest_product_date` / creation date are best-effort signals
  derived from the storefront; they are labeled as estimates in the UI.
- Re-running ingest refreshes existing stores (upsert by domain).
