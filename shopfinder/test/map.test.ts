import { describe, expect, it } from "vitest";
import { mapApivault } from "../src/ingest/map";

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
