import { describe, expect, it } from "vitest";
import { mapApivault } from "../src/ingest/map";
import liveSample from "../data/live-sample.json";

const item: Record<string, unknown> = {
  domain: "allbirds.com",
  url: "https://allbirds.com",
  og_site_name: "Allbirds",
  store_summary: "Comfortable wool shoes",
  oldest_product_date: "2016-03-01T00:00:00Z",
  locale: "en-US",
  hreflangs: ["en-US", "en-CA", "de-DE"],
  currency: "usd",
  markets: ["US", "CA", "Germany"],
  primary_niche: "Apparel & Fashion",
  top_product_types: [
    { type: "Shoes", count: 40 },
    { type: "Socks", count: 10 },
  ],
  sitemap_products: 120,
  product_count_sampled: 100,
  tech_stack: ["Klaviyo", "Gorgias"],
  traffic: { monthly_visits: 2_500_000, top_countries: [{ country_code: "US", share: 0.6 }] },
  revenue_estimate: { monthly_revenue_usd_est: 5_000_000 },
  best_sellers: [
    { title: "Wool Runner", price: 98, image: "https://img/x.jpg", product_url: "https://allbirds.com/p/wool" },
  ],
};

describe("mapApivault", () => {
  it("maps the core filter fields", () => {
    const s = mapApivault(item, "apivault_labs~shopify-store-analyzer")!;
    expect(s).not.toBeNull();
    expect(s.domain).toBe("allbirds.com");
    expect(s.name).toBe("Allbirds");
    expect(s.language).toBe("en");
    expect(s.languages).toEqual(expect.arrayContaining(["en", "de"]));
    expect(s.ships_to_countries).toEqual(["US", "CA", "DE"]); // "Germany" -> DE
    expect(s.ships_to_source).toBe("markets");
    expect(s.country).toBe("US");
    expect(s.currency).toBe("USD"); // uppercased
    expect(s.niche).toBe("Apparel & Fashion");
    expect(s.product_count).toBe(120); // sitemap preferred over sampled
    expect(s.created_at).toBe(Date.parse("2016-03-01T00:00:00Z"));
    expect(s.installed_apps).toEqual(["Klaviyo", "Gorgias"]);
    expect(s.monthly_visits).toBe(2_500_000);
    expect(s.sample_products[0]?.title).toBe("Wool Runner");
  });

  it("falls back to hreflang for ships-to when markets is empty", () => {
    const s = mapApivault({ ...item, markets: [] }, "a")!;
    expect(s.ships_to_source).toBe("hreflang");
    expect(s.ships_to_countries).toEqual(expect.arrayContaining(["US", "CA", "DE"]));
  });

  it("skips comparison-report rows and rows without a domain", () => {
    expect(mapApivault({ _comparison_report: true }, "a")).toBeNull();
    expect(mapApivault({ name: "no domain" }, "a")).toBeNull();
  });
});

// Regression guard against real captured actor output (data/live-sample.json:
// 3 stores from a live discover_and_analyze run, trimmed). Locks in the mapping
// we verified end-to-end and documents the traffic-derived gap on real data.
describe("mapApivault on real captured output", () => {
  const items = liveSample as unknown as Record<string, unknown>[];
  const stores = items.map((it) => mapApivault(it, "apivault_labs~shopify-store-analyzer")!);
  const byDomain = Object.fromEntries(stores.map((s) => [s.domain, s]));

  it("maps every captured store", () => {
    expect(stores).toHaveLength(3);
    expect(Object.keys(byDomain).sort()).toEqual([
      "cafebritt.com",
      "freshroastedcoffee.com",
      "peets.com",
    ]);
  });

  it("derives ships-to from markets and languages from locale + hreflangs", () => {
    const c = byDomain["cafebritt.com"];
    expect(c.name).toBe("Café Britt");
    expect(c.created_at).toBe(Date.parse("2023-09-22"));
    expect(c.ships_to_countries).toEqual(["CA"]);
    expect(c.ships_to_source).toBe("markets");
    expect(c.languages).toEqual(expect.arrayContaining(["en", "es"]));
    expect(c.currency).toBe("USD");
    expect(c.niche).toBe("food & beverage");
    expect(c.product_count).toBe(228); // sitemap_products
    expect(c.sample_products[0]?.currency).toBe("USD"); // fallback from store currency
  });

  it("falls back to page_title for name; traffic-derived fields stay null", () => {
    const p = byDomain["peets.com"];
    expect(p.name).toBe("Peet's Coffee | The Original Craft Coffee Since 1966");
    expect(p.ships_to_source).toBe("unknown"); // no markets / hreflang / traffic
    // The analyzer's traffic step returns nothing, so these are null on real data:
    expect(p.country).toBeNull();
    expect(p.monthly_visits).toBeNull();
    expect(p.monthly_revenue_usd).toBeNull();
  });
});
