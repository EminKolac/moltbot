import type { SortKey, StoreFilters } from "../types";

const SORTS: SortKey[] = ["newest", "oldest", "name", "product_count", "visits", "revenue"];

/** Parse URL search params into StoreFilters. Array filters accept repeats and CSV. */
export function parseFilters(sp: URLSearchParams): StoreFilters {
  const str = (k: string): string | undefined => {
    const v = sp.get(k);
    return v && v.trim() ? v.trim() : undefined;
  };
  const num = (k: string): number | undefined => {
    const v = sp.get(k);
    if (v == null || v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const list = (k: string): string[] | undefined => {
    const out: string[] = [];
    for (const v of sp.getAll(k)) {
      for (const part of v.split(",")) {
        const t = part.trim();
        if (t) out.push(t);
      }
    }
    return out.length ? out : undefined;
  };
  const sortRaw = str("sort") as SortKey | undefined;

  return {
    q: str("q"),
    created_from: str("created_from"),
    created_to: str("created_to"),
    language: list("language"),
    ships_to: list("ships_to"),
    country: list("country"),
    niche: list("niche"),
    currency: list("currency"),
    product_count_min: num("product_count_min"),
    product_count_max: num("product_count_max"),
    sort: sortRaw && SORTS.includes(sortRaw) ? sortRaw : undefined,
    page: num("page"),
    pageSize: num("pageSize"),
  };
}
