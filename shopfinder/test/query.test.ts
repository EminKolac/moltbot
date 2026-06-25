import { beforeAll, describe, expect, it } from "vitest";
import { openDb, type DB } from "../src/db/client";
import { upsertStores } from "../src/db/repo";
import { getFacets, getStats, queryStores } from "../src/api/service";
import type { Store } from "../src/types";

function store(p: Partial<Store> & { domain: string }): Store {
  return {
    domain: p.domain,
    name: p.name ?? p.domain,
    url: null,
    description: null,
    favicon_url: null,
    platform: "shopify",
    created_at: p.created_at ?? null,
    created_at_source: null,
    discovered_at: null,
    last_ingested_at: null,
    language: p.language ?? null,
    languages: p.languages ?? (p.language ? [p.language] : []),
    country: p.country ?? null,
    ships_to_countries: p.ships_to_countries ?? [],
    ships_to_source: null,
    currency: p.currency ?? null,
    niche: p.niche ?? null,
    product_types: [],
    installed_apps: [],
    product_count: p.product_count ?? null,
    monthly_visits: p.monthly_visits ?? null,
    monthly_revenue_usd: p.monthly_revenue_usd ?? null,
    sample_products: [],
    source_actor: null,
    raw: null,
  };
}

let db: DB;

beforeAll(() => {
  db = openDb(":memory:");
  upsertStores(db, [
    store({ domain: "a.com", language: "en", country: "US", ships_to_countries: ["US", "CA"], niche: "Apparel", currency: "USD", product_count: 50, created_at: Date.parse("2020-01-01") }),
    store({ domain: "b.com", language: "de", country: "DE", ships_to_countries: ["DE", "AT"], niche: "Beauty", currency: "EUR", product_count: 200, created_at: Date.parse("2023-06-01") }),
    store({ domain: "c.com", language: "en", country: "GB", ships_to_countries: ["GB", "US"], niche: "Apparel", currency: "GBP", product_count: 10, created_at: Date.parse("2018-03-01") }),
  ]);
});

describe("queryStores filters", () => {
  it("ships_to matches any country in the array", () => {
    expect(queryStores(db, { ships_to: ["CA"] }).items.map((s) => s.domain)).toEqual(["a.com"]);
    expect(new Set(queryStores(db, { ships_to: ["US"] }).items.map((s) => s.domain))).toEqual(
      new Set(["a.com", "c.com"])
    );
  });

  it("filters by language, country, currency, niche", () => {
    expect(queryStores(db, { language: ["en"] }).total).toBe(2);
    expect(queryStores(db, { country: ["DE"] }).items.map((s) => s.domain)).toEqual(["b.com"]);
    expect(queryStores(db, { currency: ["GBP"] }).items.map((s) => s.domain)).toEqual(["c.com"]);
    expect(queryStores(db, { niche: ["Apparel"] }).total).toBe(2);
  });

  it("filters by creation date range", () => {
    const r = queryStores(db, { created_from: "2019-01-01", created_to: "2021-12-31" });
    expect(r.items.map((s) => s.domain)).toEqual(["a.com"]);
  });

  it("filters by product_count range", () => {
    expect(queryStores(db, { product_count_min: 40, product_count_max: 100 }).items.map((s) => s.domain)).toEqual(["a.com"]);
  });

  it("defaults to newest-first and paginates", () => {
    expect(queryStores(db, {}).items.map((s) => s.domain)).toEqual(["b.com", "a.com", "c.com"]);
    const p = queryStores(db, { pageSize: 2, page: 1 });
    expect(p.items.length).toBe(2);
    expect(p.total).toBe(3);
  });

  it("searches by q on domain/name", () => {
    expect(queryStores(db, { q: "b.com" }).items.map((s) => s.domain)).toEqual(["b.com"]);
  });

  it("combines filters (AND)", () => {
    const r = queryStores(db, { language: ["en"], ships_to: ["US"], niche: ["Apparel"] });
    expect(new Set(r.items.map((s) => s.domain))).toEqual(new Set(["a.com", "c.com"]));
  });
});

describe("getFacets", () => {
  it("aggregates scalar and JSON-array facets with counts", () => {
    const f = getFacets(db);
    expect(f.ships_to.find((v) => v.value === "US")?.count).toBe(2);
    expect(f.languages.find((v) => v.value === "en")?.count).toBe(2);
    expect(f.niches.find((v) => v.value === "Apparel")?.count).toBe(2);
    expect(f.currencies.find((v) => v.value === "EUR")?.count).toBe(1);
  });
});

describe("niche matching is case-insensitive", () => {
  it("filters and facets niche regardless of casing", () => {
    const ndb = openDb(":memory:");
    upsertStores(ndb, [
      store({ domain: "x.com", niche: "Food & Beverage" }),
      store({ domain: "y.com", niche: "food & beverage" }),
      store({ domain: "z.com", niche: "Beauty" }),
    ]);
    // A single casing in the filter matches every stored casing.
    expect(queryStores(ndb, { niche: ["food & beverage"] }).total).toBe(2);
    expect(queryStores(ndb, { niche: ["FOOD & BEVERAGE"] }).total).toBe(2);
    // The two casings collapse into one facet entry with the summed count.
    const fb = getFacets(ndb).niches.filter((v) => v.value.toLowerCase() === "food & beverage");
    expect(fb).toHaveLength(1);
    expect(fb[0].count).toBe(2);
  });
});

describe("getStats", () => {
  it("reports whether traffic-derived data is present", () => {
    const sdb = openDb(":memory:");
    upsertStores(sdb, [
      store({ domain: "a.com" }),
      store({ domain: "b.com", monthly_visits: 1000 }),
    ]);
    const st = getStats(sdb);
    expect(st.total).toBe(2);
    expect(st.hasVisits).toBe(true); // b.com has visits
    expect(st.hasRevenue).toBe(false); // none have revenue
  });
});
