export type SourceName = "apivault" | "clearpath";

export interface DiscoverParams {
  /** Search terms / niches to discover stores for. */
  terms: string[];
  /** ISO-2 country-of-origin bias (best-effort). */
  country?: string;
  /** ISO-2 ships-to country (clearpath only). */
  shipsTo?: string;
  /** Max stores to return. */
  max: number;
}

/** Resolve a friendly source name to its Apify actor id (env-overridable). */
export function actorFor(source: SourceName): string {
  if (source === "clearpath") {
    return process.env.APIFY_SHIPSTO_ACTOR ?? "clearpath~shopify-store-leads";
  }
  return process.env.APIFY_DISCOVERY_ACTOR ?? "apivault_labs~shopify-store-analyzer";
}

/**
 * apivault_labs/shopify-store-analyzer — discover by keyword/niche and analyze each store.
 * We enable exactly the extraction flags that feed our filters and disable the slow/irrelevant
 * ones (contacts, brand-age Wayback lookups, comparison report) to keep runs fast and cheap.
 */
export function apivaultInput(p: DiscoverParams): Record<string, unknown> {
  return {
    mode: "discover_and_analyze",
    searchTerms: p.terms,
    discoverCountry: p.country || undefined,
    maxStores: p.max,
    enrichContacts: false,
    extractContact: false,
    deepContactCrawl: false,
    extractInternational: true, // markets[], hreflangs, country selector
    extractVelocity: true, // oldest_product_date (creation proxy)
    extractShopifyMeta: true, // locale, currency, cdn_store_id
    extractProducts: true, // primary_niche, product types
    extractSitemap: true, // sitemap_products (product count)
    extractTraffic: true, // monthly_visits, top_countries
    extractRevenueEstimate: true,
    extractTechStack: true, // installed apps
    extractSocials: false,
    extractPromo: false,
    extractReviewsAggregate: false,
    extractBrandAge: false,
    trackChanges: false,
    generateComparison: false,
  };
}

/**
 * clearpath/shopify-store-leads — discovery with an explicit ships-to-country filter.
 * Leaner output (no creation date / language), used only when you want to seed by ships-to.
 */
export function clearpathInput(p: DiscoverParams): Record<string, unknown> {
  return {
    query: p.terms.join(" ").trim() || undefined,
    maxItems: p.max,
    shipsTo: p.shipsTo || undefined,
    storeLocation: p.country || undefined,
  };
}

export function inputFor(source: SourceName, p: DiscoverParams): Record<string, unknown> {
  return source === "clearpath" ? clearpathInput(p) : apivaultInput(p);
}
