import type { Store } from "../types";
import { fmtDate, fmtInt, fmtMoney } from "../format";

export function StoreDetailDrawer({
  store,
  onClose,
}: {
  store: Store | null;
  onClose: () => void;
}) {
  if (!store) return null;
  const s = store;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <header className="drawer-head">
          {s.favicon_url && <img className="favicon lg" src={s.favicon_url} alt="" width={40} height={40} />}
          <div>
            <h2>{s.name ?? s.domain}</h2>
            <a href={s.url ?? `https://${s.domain}`} target="_blank" rel="noreferrer">
              {s.domain} ↗
            </a>
          </div>
        </header>

        {s.description && <p className="drawer-desc">{s.description}</p>}

        <dl className="kv">
          <Row k="Created (est.)" v={fmtDate(s.created_at)} note={s.created_at_source} />
          <Row
            k="Language"
            v={
              s.languages.length
                ? s.languages.map((l) => l.toUpperCase()).join(", ")
                : s.language?.toUpperCase() ?? "—"
            }
          />
          <Row k="Ships to" v={s.ships_to_countries.join(", ") || "—"} note={s.ships_to_source} />
          <Row k="Country of origin" v={s.country ?? "—"} />
          <Row k="Currency" v={s.currency ?? "—"} />
          <Row k="Niche" v={s.niche ?? "—"} />
          <Row k="Products" v={fmtInt(s.product_count)} />
          <Row k="Monthly visits" v={fmtInt(s.monthly_visits)} />
          <Row k="Monthly revenue (est.)" v={fmtMoney(s.monthly_revenue_usd, "USD")} />
          <Row k="Source" v={s.source_actor ?? "—"} />
        </dl>

        {s.product_types.length > 0 && <Chips title="Product types" items={s.product_types} />}
        {s.installed_apps.length > 0 && <Chips title="Installed apps / tech" items={s.installed_apps} />}

        {s.sample_products.length > 0 && (
          <div className="drawer-section">
            <h3>Sample products</h3>
            <div className="products">
              {s.sample_products.map((p, i) => (
                <a
                  key={i}
                  className="product"
                  href={p.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.image && <img src={p.image} alt="" loading="lazy" />}
                  <span className="p-title">{p.title ?? "—"}</span>
                  {p.price != null && (
                    <span className="p-price">{fmtMoney(p.price, p.currency ?? s.currency ?? "USD")}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="drawer-links">
          <a href={`https://${s.domain}/products.json`} target="_blank" rel="noreferrer">
            products.json ↗
          </a>
        </div>
      </aside>
    </>
  );
}

function Row({ k, v, note }: { k: string; v: string; note?: string | null }) {
  return (
    <div className="kv-row">
      <dt>{k}</dt>
      <dd>
        {v}
        {note && <em className="note"> · {note}</em>}
      </dd>
    </div>
  );
}

function Chips({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="drawer-section">
      <h3>{title}</h3>
      <div className="chips">
        {items.slice(0, 30).map((x, i) => (
          <span key={i} className="chip ghost">
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}
