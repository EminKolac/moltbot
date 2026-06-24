export interface SampleProduct {
  title: string | null;
  price: number | null;
  currency: string | null;
  image: string | null;
  url: string | null;
}

export interface Store {
  domain: string;
  name: string | null;
  url: string | null;
  description: string | null;
  favicon_url: string | null;
  platform: string;
  /** Store launch proxy (epoch ms) — earliest product / oldest signal. */
  created_at: number | null;
  created_at_source: string | null;
  discovered_at: number | null;
  last_ingested_at: number | null;
  /** Primary language, lowercased base tag e.g. "en". */
  language: string | null;
  languages: string[];
  /** ISO-3166 alpha-2, country of origin (best-effort). */
  country: string | null;
  /** ISO-3166 alpha-2 list, markets the store ships to (best-effort). */
  ships_to_countries: string[];
  ships_to_source: string | null;
  /** ISO-4217. */
  currency: string | null;
  niche: string | null;
  product_types: string[];
  installed_apps: string[];
  product_count: number | null;
  monthly_visits: number | null;
  monthly_revenue_usd: number | null;
  sample_products: SampleProduct[];
  source_actor: string | null;
  raw: unknown;
}

export type SortKey =
  | "newest"
  | "oldest"
  | "name"
  | "product_count"
  | "visits"
  | "revenue";

export interface StoreFilters {
  q?: string;
  /** ISO date strings (YYYY-MM-DD). */
  created_from?: string;
  created_to?: string;
  language?: string[];
  ships_to?: string[];
  country?: string[];
  niche?: string[];
  currency?: string[];
  product_count_min?: number;
  product_count_max?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface StoresResult {
  items: Store[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facets {
  languages: FacetValue[];
  countries: FacetValue[];
  ships_to: FacetValue[];
  niches: FacetValue[];
  currencies: FacetValue[];
}
