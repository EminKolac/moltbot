import { useState } from "react";
import type { Facets, FacetValue, StoreFilters } from "../types";

export type MultiKey = "language" | "ships_to" | "country" | "niche" | "currency";

interface Props {
  facets: Facets | null;
  filters: StoreFilters;
  onToggle: (key: MultiKey, value: string) => void;
  onDate: (key: "created_from" | "created_to", value: string) => void;
  onNumber: (key: "product_count_min" | "product_count_max", value: string) => void;
  onClear: () => void;
}

export function FiltersSidebar({ facets, filters, onToggle, onDate, onNumber, onClear }: Props) {
  const activeCount =
    (filters.language?.length ?? 0) +
    (filters.ships_to?.length ?? 0) +
    (filters.country?.length ?? 0) +
    (filters.niche?.length ?? 0) +
    (filters.currency?.length ?? 0) +
    (filters.created_from ? 1 : 0) +
    (filters.created_to ? 1 : 0) +
    (filters.product_count_min != null ? 1 : 0) +
    (filters.product_count_max != null ? 1 : 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>Filters</h2>
        {activeCount > 0 && (
          <button className="link-btn" onClick={onClear}>
            Clear ({activeCount})
          </button>
        )}
      </div>

      <Section title="Creation date">
        <div className="date-row">
          <label>
            From
            <input
              type="date"
              value={filters.created_from ?? ""}
              onChange={(e) => onDate("created_from", e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.created_to ?? ""}
              onChange={(e) => onDate("created_to", e.target.value)}
            />
          </label>
        </div>
      </Section>

      <FacetGroup
        title="Shipping country"
        values={facets?.ships_to}
        selected={filters.ships_to}
        onToggle={(v) => onToggle("ships_to", v)}
      />
      <FacetGroup
        title="Language"
        values={facets?.languages}
        selected={filters.language}
        onToggle={(v) => onToggle("language", v)}
      />
      <FacetGroup
        title="Niche"
        values={facets?.niches}
        selected={filters.niche}
        onToggle={(v) => onToggle("niche", v)}
      />
      <FacetGroup
        title="Country of origin"
        values={facets?.countries}
        selected={filters.country}
        onToggle={(v) => onToggle("country", v)}
      />
      <FacetGroup
        title="Currency"
        values={facets?.currencies}
        selected={filters.currency}
        onToggle={(v) => onToggle("currency", v)}
      />

      <Section title="Product count">
        <div className="date-row">
          <label>
            Min
            <input
              type="number"
              min={0}
              value={filters.product_count_min ?? ""}
              onChange={(e) => onNumber("product_count_min", e.target.value)}
            />
          </label>
          <label>
            Max
            <input
              type="number"
              min={0}
              value={filters.product_count_max ?? ""}
              onChange={(e) => onNumber("product_count_max", e.target.value)}
            />
          </label>
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="facet">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function FacetGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values?: FacetValue[];
  selected?: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const list = values ?? [];
  const shown = expanded ? list : list.slice(0, 8);
  const sel = new Set(selected ?? []);

  return (
    <div className="facet">
      <h3>{title}</h3>
      {list.length === 0 ? (
        <p className="facet-empty">No data yet</p>
      ) : (
        <>
          <ul className="facet-list">
            {shown.map((v) => (
              <li key={v.value}>
                <label className={sel.has(v.value) ? "checked" : ""}>
                  <input
                    type="checkbox"
                    checked={sel.has(v.value)}
                    onChange={() => onToggle(v.value)}
                  />
                  <span className="facet-value">{v.value}</span>
                  <span className="facet-count">{v.count}</span>
                </label>
              </li>
            ))}
          </ul>
          {list.length > 8 && (
            <button className="link-btn" onClick={() => setExpanded((x) => !x)}>
              {expanded ? "Show less" : `Show ${list.length - 8} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
