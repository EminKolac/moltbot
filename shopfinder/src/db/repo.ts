import type { DB } from "./client";
import type { SampleProduct, Store } from "../types";
import { jsonParse } from "../lib/util";

/** Raw DB row shape (JSON columns are strings). */
interface Row {
  domain: string;
  name: string | null;
  url: string | null;
  description: string | null;
  favicon_url: string | null;
  platform: string | null;
  created_at: number | null;
  created_at_source: string | null;
  discovered_at: number | null;
  last_ingested_at: number | null;
  language: string | null;
  languages: string | null;
  country: string | null;
  ships_to_countries: string | null;
  ships_to_source: string | null;
  currency: string | null;
  niche: string | null;
  product_types: string | null;
  installed_apps: string | null;
  product_count: number | null;
  monthly_visits: number | null;
  monthly_revenue_usd: number | null;
  sample_products: string | null;
  source_actor: string | null;
  raw: string | null;
}

export function rowToStore(row: Row): Store {
  return {
    domain: row.domain,
    name: row.name,
    url: row.url,
    description: row.description,
    favicon_url: row.favicon_url,
    platform: row.platform ?? "shopify",
    created_at: row.created_at,
    created_at_source: row.created_at_source,
    discovered_at: row.discovered_at,
    last_ingested_at: row.last_ingested_at,
    language: row.language,
    languages: jsonParse<string[]>(row.languages, []),
    country: row.country,
    ships_to_countries: jsonParse<string[]>(row.ships_to_countries, []),
    ships_to_source: row.ships_to_source,
    currency: row.currency,
    niche: row.niche,
    product_types: jsonParse<string[]>(row.product_types, []),
    installed_apps: jsonParse<string[]>(row.installed_apps, []),
    product_count: row.product_count,
    monthly_visits: row.monthly_visits,
    monthly_revenue_usd: row.monthly_revenue_usd,
    sample_products: jsonParse<SampleProduct[]>(row.sample_products, []),
    source_actor: row.source_actor,
    raw: jsonParse<unknown>(row.raw, null),
  };
}

const UPSERT_SQL = `
INSERT INTO stores (
  domain, name, url, description, favicon_url, platform,
  created_at, created_at_source, discovered_at, last_ingested_at,
  language, languages, country, ships_to_countries, ships_to_source,
  currency, niche, product_types, installed_apps,
  product_count, monthly_visits, monthly_revenue_usd, sample_products,
  source_actor, raw
) VALUES (
  @domain, @name, @url, @description, @favicon_url, @platform,
  @created_at, @created_at_source, @discovered_at, @last_ingested_at,
  @language, @languages, @country, @ships_to_countries, @ships_to_source,
  @currency, @niche, @product_types, @installed_apps,
  @product_count, @monthly_visits, @monthly_revenue_usd, @sample_products,
  @source_actor, @raw
)
ON CONFLICT(domain) DO UPDATE SET
  name = excluded.name,
  url = excluded.url,
  description = excluded.description,
  favicon_url = excluded.favicon_url,
  platform = excluded.platform,
  created_at = COALESCE(excluded.created_at, stores.created_at),
  created_at_source = COALESCE(excluded.created_at_source, stores.created_at_source),
  last_ingested_at = excluded.last_ingested_at,
  language = COALESCE(excluded.language, stores.language),
  languages = excluded.languages,
  country = COALESCE(excluded.country, stores.country),
  ships_to_countries = excluded.ships_to_countries,
  ships_to_source = COALESCE(excluded.ships_to_source, stores.ships_to_source),
  currency = COALESCE(excluded.currency, stores.currency),
  niche = COALESCE(excluded.niche, stores.niche),
  product_types = excluded.product_types,
  installed_apps = excluded.installed_apps,
  product_count = COALESCE(excluded.product_count, stores.product_count),
  monthly_visits = COALESCE(excluded.monthly_visits, stores.monthly_visits),
  monthly_revenue_usd = COALESCE(excluded.monthly_revenue_usd, stores.monthly_revenue_usd),
  sample_products = excluded.sample_products,
  source_actor = excluded.source_actor,
  raw = excluded.raw
`;

function toParams(s: Store) {
  const now = s.last_ingested_at ?? Date.now();
  return {
    domain: s.domain,
    name: s.name ?? null,
    url: s.url ?? null,
    description: s.description ?? null,
    favicon_url: s.favicon_url ?? null,
    platform: s.platform ?? "shopify",
    created_at: s.created_at ?? null,
    created_at_source: s.created_at_source ?? null,
    discovered_at: s.discovered_at ?? now,
    last_ingested_at: now,
    language: s.language ?? null,
    languages: JSON.stringify(s.languages ?? []),
    country: s.country ?? null,
    ships_to_countries: JSON.stringify(s.ships_to_countries ?? []),
    ships_to_source: s.ships_to_source ?? null,
    currency: s.currency ?? null,
    niche: s.niche ?? null,
    product_types: JSON.stringify(s.product_types ?? []),
    installed_apps: JSON.stringify(s.installed_apps ?? []),
    product_count: s.product_count ?? null,
    monthly_visits: s.monthly_visits ?? null,
    monthly_revenue_usd: s.monthly_revenue_usd ?? null,
    sample_products: JSON.stringify(s.sample_products ?? []),
    source_actor: s.source_actor ?? null,
    raw: s.raw == null ? null : JSON.stringify(s.raw),
  };
}

/** Upsert many stores in a single transaction. Returns the number written. */
export function upsertStores(db: DB, stores: Store[]): number {
  const stmt = db.prepare(UPSERT_SQL);
  const tx = db.transaction((rows: Store[]) => {
    for (const s of rows) stmt.run(toParams(s));
    return rows.length;
  });
  return tx(stores);
}

export function getStoreByDomain(db: DB, domain: string): Store | null {
  const row = db.prepare("SELECT * FROM stores WHERE domain = ?").get(domain) as
    | Row
    | undefined;
  return row ? rowToStore(row) : null;
}

export function countStores(db: DB): number {
  const r = db.prepare("SELECT COUNT(*) AS c FROM stores").get() as { c: number };
  return r.c;
}

export function lastIngestedAt(db: DB): number | null {
  const r = db.prepare("SELECT MAX(last_ingested_at) AS m FROM stores").get() as {
    m: number | null;
  };
  return r.m ?? null;
}
