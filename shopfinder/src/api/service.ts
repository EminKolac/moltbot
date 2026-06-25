import type { DB } from "../db/client";
import {
  countStores,
  getStoreByDomain,
  lastIngestedAt,
  rowToStore,
} from "../db/repo";
import type { Facets, FacetValue, Store, StoreFilters, StoresResult } from "../types";
import { buildStoresQuery } from "./query";

type Row = Parameters<typeof rowToStore>[0];

export function queryStores(db: DB, f: StoreFilters): StoresResult {
  const q = buildStoresQuery(f);
  const rows = db.prepare(q.sql).all(...q.params) as Row[];
  const total = (db.prepare(q.countSql).get(...q.countParams) as { c: number }).c;
  const page = Math.max(1, Math.floor(f.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(f.pageSize ?? 24)));
  return { items: rows.map(rowToStore), total, page, pageSize };
}

export function getStore(db: DB, domain: string): Store | null {
  return getStoreByDomain(db, domain);
}

function mapFacetRows(rows: unknown[]): FacetValue[] {
  return (rows as Array<{ value: unknown; count: unknown }>).map((r) => ({
    value: String(r.value),
    count: Number(r.count),
  }));
}

function scalarFacet(db: DB, column: string, collate?: string): FacetValue[] {
  const grouped = collate ? `${column} COLLATE ${collate}` : column;
  return mapFacetRows(
    db
      .prepare(
        `SELECT ${column} AS value, COUNT(*) AS count FROM stores
         WHERE ${column} IS NOT NULL AND ${column} != ''
         GROUP BY ${grouped} ORDER BY count DESC, value ASC`
      )
      .all()
  );
}

function jsonFacet(db: DB, column: string): FacetValue[] {
  return mapFacetRows(
    db
      .prepare(
        `SELECT je.value AS value, COUNT(*) AS count
         FROM stores, json_each(stores.${column}) je
         WHERE je.value IS NOT NULL AND je.value != ''
         GROUP BY je.value ORDER BY count DESC, value ASC`
      )
      .all()
  );
}

export function getFacets(db: DB): Facets {
  return {
    languages: scalarFacet(db, "language"),
    countries: scalarFacet(db, "country"),
    ships_to: jsonFacet(db, "ships_to_countries"),
    niches: scalarFacet(db, "niche", "NOCASE"),
    currencies: scalarFacet(db, "currency"),
  };
}

export function getStats(db: DB): {
  total: number;
  lastIngestedAt: number | null;
  hasVisits: boolean;
  hasRevenue: boolean;
} {
  // Surface whether any store actually has traffic-derived data, so the UI can
  // hide sorts (visits/revenue) that would otherwise be empty for this source.
  const f = db
    .prepare(
      `SELECT EXISTS(SELECT 1 FROM stores WHERE monthly_visits IS NOT NULL) AS v,
              EXISTS(SELECT 1 FROM stores WHERE monthly_revenue_usd IS NOT NULL) AS r`
    )
    .get() as { v: number; r: number };
  return {
    total: countStores(db),
    lastIngestedAt: lastIngestedAt(db),
    hasVisits: !!f.v,
    hasRevenue: !!f.r,
  };
}
