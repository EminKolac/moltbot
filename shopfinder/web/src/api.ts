import type { Facets, SortKey, Stats, StoreFilters, StoresResult } from "./types";

export function filtersToQuery(f: StoreFilters): string {
  const p = new URLSearchParams();
  const arr = (k: string, v?: string[]) => v?.forEach((x) => p.append(k, x));
  if (f.q) p.set("q", f.q);
  if (f.created_from) p.set("created_from", f.created_from);
  if (f.created_to) p.set("created_to", f.created_to);
  arr("language", f.language);
  arr("ships_to", f.ships_to);
  arr("country", f.country);
  arr("niche", f.niche);
  arr("currency", f.currency);
  if (f.product_count_min != null) p.set("product_count_min", String(f.product_count_min));
  if (f.product_count_max != null) p.set("product_count_max", String(f.product_count_max));
  if (f.sort) p.set("sort", f.sort);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  return p.toString();
}

export function queryToFilters(search: string): StoreFilters {
  const p = new URLSearchParams(search);
  const list = (k: string) => {
    const a = p.getAll(k).flatMap((v) => v.split(",")).map((s) => s.trim()).filter(Boolean);
    return a.length ? a : undefined;
  };
  const num = (k: string) => {
    const v = p.get(k);
    return v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;
  };
  return {
    q: p.get("q") ?? undefined,
    created_from: p.get("created_from") ?? undefined,
    created_to: p.get("created_to") ?? undefined,
    language: list("language"),
    ships_to: list("ships_to"),
    country: list("country"),
    niche: list("niche"),
    currency: list("currency"),
    product_count_min: num("product_count_min"),
    product_count_max: num("product_count_max"),
    sort: (p.get("sort") as SortKey) ?? undefined,
    page: num("page"),
    pageSize: num("pageSize"),
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchStores = (f: StoreFilters) =>
  getJson<StoresResult>(`/api/stores?${filtersToQuery(f)}`);
export const fetchFacets = () => getJson<Facets>("/api/facets");
export const fetchStats = () => getJson<Stats>("/api/stats");
