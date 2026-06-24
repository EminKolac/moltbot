import { useEffect, useState } from "react";
import { fetchFacets, fetchStats, fetchStores, filtersToQuery, queryToFilters } from "./api";
import type { Facets, SortKey, Stats, Store, StoreFilters, StoresResult } from "./types";
import { FiltersSidebar, type MultiKey } from "./components/FiltersSidebar";
import { ResultsGrid } from "./components/ResultsGrid";
import { Pagination } from "./components/Pagination";
import { StoreDetailDrawer } from "./components/StoreDetailDrawer";
import { fmtInt, timeAgo } from "./format";

const PAGE_SIZE = 24;
const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "product_count", label: "Most products" },
  { value: "visits", label: "Most visits" },
  { value: "revenue", label: "Top revenue" },
];

export function App() {
  const [filters, setFilters] = useState<StoreFilters>(() => queryToFilters(window.location.search));
  const [qInput, setQInput] = useState(filters.q ?? "");
  const [data, setData] = useState<StoresResult | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Store | null>(null);

  useEffect(() => {
    fetchFacets().then(setFacets).catch(() => undefined);
    fetchStats().then(setStats).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchStores({ ...filters, pageSize: PAGE_SIZE })
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const qs = filtersToQuery(filters);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    return () => {
      cancelled = true;
    };
  }, [filters]);

  // Debounce the free-text search box into filters.q.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => {
        const q = qInput.trim() || undefined;
        return prev.q === q ? prev : { ...prev, q, page: 1 };
      });
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const update = (partial: Partial<StoreFilters>) =>
    setFilters((p) => ({ ...p, ...partial, page: 1 }));

  const toggle = (key: MultiKey, value: string) =>
    setFilters((p) => {
      const cur = new Set(p[key] ?? []);
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      const next = [...cur];
      return { ...p, [key]: next.length ? next : undefined, page: 1 };
    });

  const onDate = (key: "created_from" | "created_to", value: string) =>
    update({ [key]: value || undefined } as Partial<StoreFilters>);

  const onNumber = (key: "product_count_min" | "product_count_max", value: string) =>
    update({ [key]: value === "" ? undefined : Number(value) } as Partial<StoreFilters>);

  const clearAll = () => {
    setQInput("");
    setFilters({ sort: filters.sort });
  };

  const total = data?.total ?? 0;
  const page = data?.page ?? 1;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🛍️ ShopFinder</div>
        <input
          className="search"
          placeholder="Search store name or domain…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <div className="topstats">
          {stats ? (
            <>
              <strong>{fmtInt(stats.total)}</strong> stores · updated {timeAgo(stats.lastIngestedAt)}
            </>
          ) : (
            "…"
          )}
        </div>
      </header>

      <div className="layout">
        <FiltersSidebar
          facets={facets}
          filters={filters}
          onToggle={toggle}
          onDate={onDate}
          onNumber={onNumber}
          onClear={clearAll}
        />

        <main className="main">
          <div className="results-head">
            <div className="count">{loading ? "Loading…" : `${fmtInt(total)} stores`}</div>
            <label className="sort">
              Sort
              <select
                value={filters.sort ?? "newest"}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="banner error">Error: {error}</div>}

          {!loading && total === 0 && !error && (
            <div className="empty">
              <h2>No stores yet</h2>
              <p>Pull some into the database with the ingester, for example:</p>
              <pre>npm run ingest -- --terms "organic coffee,yoga mats" --max 25</pre>
              <p>then refresh this page.</p>
            </div>
          )}

          {data && data.items.length > 0 && <ResultsGrid stores={data.items} onSelect={setSelected} />}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </main>
      </div>

      <StoreDetailDrawer store={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
