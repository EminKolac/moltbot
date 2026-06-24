import type { Store } from "../types";
import { fmtInt, fmtYear } from "../format";

export function ResultsGrid({
  stores,
  onSelect,
}: {
  stores: Store[];
  onSelect: (s: Store) => void;
}) {
  return (
    <div className="grid">
      {stores.map((s) => (
        <article key={s.domain} className="card" onClick={() => onSelect(s)}>
          <header className="card-head">
            {s.favicon_url && (
              <img
                className="favicon"
                src={s.favicon_url}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
            )}
            <div className="card-title">
              <strong title={s.name ?? s.domain}>{s.name ?? s.domain}</strong>
              <a
                href={s.url ?? `https://${s.domain}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {s.domain}
              </a>
            </div>
          </header>

          <div className="card-meta">
            {s.niche && <span className="chip">{s.niche}</span>}
            {s.created_at && <span className="chip ghost">est. {fmtYear(s.created_at)}</span>}
            {s.language && <span className="chip ghost">{s.language.toUpperCase()}</span>}
          </div>

          <dl className="card-stats">
            <div>
              <dt>Ships to</dt>
              <dd>
                {s.ships_to_countries.length
                  ? s.ships_to_countries.slice(0, 4).join(", ") +
                    (s.ships_to_countries.length > 4 ? ` +${s.ships_to_countries.length - 4}` : "")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Products</dt>
              <dd>{fmtInt(s.product_count)}</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>{s.country ?? "—"}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{s.currency ?? "—"}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
