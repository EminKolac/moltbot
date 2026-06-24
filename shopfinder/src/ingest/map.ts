import type { SampleProduct, Store } from "../types";
import type { SourceName } from "./sources";
import { toCountryCode } from "../lib/countries";
import {
  asCountryCode,
  asNumber,
  compact,
  countryFromHreflang,
  langBase,
  normalizeDomain,
  uniq,
  up,
} from "../lib/util";

type Rec = Record<string, unknown>;

const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

function favicon(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}

/** Context carried from the discovery params, used to tag leaner sources. */
export interface MapContext {
  shipsTo?: string;
  country?: string;
  niche?: string;
}

/**
 * apivault_labs/shopify-store-analyzer output -> Store.
 * Comparison-report rows (no domain) are skipped.
 */
export function mapApivault(item: Rec, source: string): Store | null {
  if (item._comparison_report) return null;
  const domain = normalizeDomain(
    str(item.domain) ?? str(item.url) ?? str(item.input_url) ?? str(item.myshopify_handle)
  );
  if (!domain) return null;

  const traffic = rec(item.traffic);
  const revenue = rec(item.revenue_estimate);
  const hreflangs = compact(arr(item.hreflangs).map((h) => str(h)));
  const topCountries = arr(traffic.top_countries)
    .map((c) => asCountryCode(str(rec(c).country_code)))
    .filter((c): c is string => !!c);

  // ships-to markets: prefer explicit markets[], else hreflang country parts, else traffic geos.
  let shipsTo = uniq(compact(arr(item.markets).map((m) => toCountryCode(str(m)))));
  let shipsToSource: string | null = shipsTo.length ? "markets" : null;
  if (!shipsTo.length) {
    const fromHreflang = uniq(compact(hreflangs.map((h) => countryFromHreflang(h))));
    if (fromHreflang.length) {
      shipsTo = fromHreflang;
      shipsToSource = "hreflang";
    } else if (topCountries.length) {
      shipsTo = uniq(topCountries);
      shipsToSource = "traffic";
    } else {
      shipsToSource = "unknown";
    }
  }

  const productTypes = compact(
    arr(item.top_product_types).map((t) => str(rec(t).type))
  );
  const currency = up(str(item.currency));
  const sampleProducts = mapSampleProducts(
    arr(item.best_sellers).length ? arr(item.best_sellers) : arr(item.recent_products),
    currency
  );

  return {
    domain,
    name: str(item.og_site_name) ?? str(item.og_title) ?? str(item.page_title) ?? domain,
    url: str(item.url) ?? str(item.input_url) ?? `https://${domain}`,
    description: str(item.store_summary) ?? str(item.og_description),
    favicon_url: favicon(domain),
    platform: "shopify",
    created_at: toEpochSafe(item.oldest_product_date),
    created_at_source: str(item.oldest_product_date) ? "oldest_product" : null,
    discovered_at: null,
    last_ingested_at: null,
    language: langBase(str(item.locale)) ?? langBase(hreflangs[0]),
    languages: uniq(compact([langBase(str(item.locale)), ...hreflangs.map((h) => langBase(h))])),
    country: topCountries[0] ?? null,
    ships_to_countries: shipsTo,
    ships_to_source: shipsToSource,
    currency,
    niche: str(item.primary_niche) ?? productTypes[0] ?? null,
    product_types: productTypes,
    installed_apps: compact(arr(item.tech_stack).map((t) => str(t))),
    product_count: asNumber(item.sitemap_products) ?? asNumber(item.product_count_sampled),
    monthly_visits: asNumber(traffic.monthly_visits),
    monthly_revenue_usd: asNumber(revenue.monthly_revenue_usd_est),
    sample_products: sampleProducts,
    source_actor: source,
    raw: item,
  };
}

/** clearpath/shopify-store-leads output -> Store (leaner; tagged from discovery context). */
export function mapClearpath(item: Rec, source: string, ctx: MapContext = {}): Store | null {
  const domain = normalizeDomain(
    str(item.websiteUrl) ?? str(item.myshopifyDomain) ?? str(item.name)
  );
  if (!domain) return null;

  const address = rec(item.address);
  const country = toCountryCode(str(address.country)) ?? toCountryCode(ctx.country);
  const currency = up(str(rec(arr(item.sampleProducts)[0]).currency));
  const shipsTo = compact([toCountryCode(ctx.shipsTo)]);

  return {
    domain,
    name: str(item.name) ?? domain,
    url: str(item.websiteUrl) ?? `https://${domain}`,
    description: null,
    favicon_url: favicon(domain),
    platform: "shopify",
    created_at: null,
    created_at_source: null,
    discovered_at: null,
    last_ingested_at: null,
    language: null,
    languages: [],
    country,
    ships_to_countries: shipsTo,
    ships_to_source: shipsTo.length ? "filter" : "unknown",
    currency,
    niche: ctx.niche ?? null,
    product_types: [],
    installed_apps: [],
    product_count: null,
    monthly_visits: null,
    monthly_revenue_usd: null,
    sample_products: mapSampleProducts(arr(item.sampleProducts), currency),
    source_actor: source,
    raw: item,
  };
}

function mapSampleProducts(items: unknown[], currency: string | null): SampleProduct[] {
  return items.slice(0, 8).map((p) => {
    const r = rec(p);
    return {
      title: str(r.title),
      price: asNumber(r.price),
      currency: up(str(r.currency)) ?? currency,
      image: str(r.image) ?? str(r.imageUrl) ?? str(r.featuredImage),
      url: str(r.product_url) ?? str(r.url),
    };
  });
}

function toEpochSafe(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

/** Dispatch raw actor items to the right mapper and drop unmappable rows. */
export function mapItems(
  source: SourceName,
  items: unknown[],
  actor: string,
  ctx: MapContext = {}
): Store[] {
  const out: Store[] = [];
  for (const it of items) {
    const mapped =
      source === "clearpath"
        ? mapClearpath(rec(it), actor, ctx)
        : mapApivault(rec(it), actor);
    if (mapped) out.push(mapped);
  }
  return out;
}
