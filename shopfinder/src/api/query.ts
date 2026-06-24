import type { SortKey, StoreFilters } from "../types";

export interface BuiltQuery {
  sql: string;
  countSql: string;
  params: unknown[];
  countParams: unknown[];
}

function orderClause(sort?: SortKey): string {
  switch (sort) {
    case "oldest":
      return "created_at IS NULL, created_at ASC, domain ASC";
    case "name":
      return "name IS NULL, name COLLATE NOCASE ASC, domain ASC";
    case "product_count":
      return "product_count IS NULL, product_count DESC, domain ASC";
    case "visits":
      return "monthly_visits IS NULL, monthly_visits DESC, domain ASC";
    case "revenue":
      return "monthly_revenue_usd IS NULL, monthly_revenue_usd DESC, domain ASC";
    case "newest":
    default:
      return "created_at IS NULL, created_at DESC, domain ASC";
  }
}

const placeholders = (n: number) => Array.from({ length: n }, () => "?").join(",");

/** Build the SELECT (with WHERE/ORDER/LIMIT) and matching COUNT query for the given filters. */
export function buildStoresQuery(f: StoreFilters): BuiltQuery {
  const where: string[] = [];
  const params: unknown[] = [];

  if (f.q?.trim()) {
    where.push("(name LIKE ? OR domain LIKE ? OR description LIKE ?)");
    const like = `%${f.q.trim()}%`;
    params.push(like, like, like);
  }

  if (f.created_from) {
    const t = Date.parse(f.created_from);
    if (!Number.isNaN(t)) {
      where.push("created_at >= ?");
      params.push(t);
    }
  }
  if (f.created_to) {
    const t = Date.parse(f.created_to);
    if (!Number.isNaN(t)) {
      where.push("created_at <= ?");
      params.push(t + 86_399_999); // include the whole end day
    }
  }

  // Language: match the primary column OR any value in the languages JSON array.
  const langs = norm(f.language, (s) => s.toLowerCase());
  if (langs.length) {
    where.push(
      `(language IN (${placeholders(langs.length)}) OR EXISTS (SELECT 1 FROM json_each(stores.languages) WHERE json_each.value IN (${placeholders(langs.length)})))`
    );
    params.push(...langs, ...langs);
  }

  // Ships-to: any selected country present in the ships_to_countries JSON array.
  const shipsTo = norm(f.ships_to, (s) => s.toUpperCase());
  if (shipsTo.length) {
    where.push(
      `EXISTS (SELECT 1 FROM json_each(stores.ships_to_countries) WHERE json_each.value IN (${placeholders(shipsTo.length)}))`
    );
    params.push(...shipsTo);
  }

  pushIn(where, params, "country", norm(f.country, (s) => s.toUpperCase()));
  pushIn(where, params, "currency", norm(f.currency, (s) => s.toUpperCase()));
  pushIn(where, params, "niche", norm(f.niche, (s) => s));

  if (f.product_count_min != null) {
    where.push("product_count >= ?");
    params.push(f.product_count_min);
  }
  if (f.product_count_max != null) {
    where.push("product_count <= ?");
    params.push(f.product_count_max);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const page = Math.max(1, Math.floor(f.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(f.pageSize ?? 24)));

  return {
    sql: `SELECT * FROM stores ${whereSql} ORDER BY ${orderClause(f.sort)} LIMIT ? OFFSET ?`,
    countSql: `SELECT COUNT(*) AS c FROM stores ${whereSql}`,
    params: [...params, pageSize, (page - 1) * pageSize],
    countParams: [...params],
  };
}

function norm(values: string[] | undefined, fn: (s: string) => string): string[] {
  if (!values) return [];
  return [...new Set(values.map((v) => fn(String(v).trim())).filter(Boolean))];
}

function pushIn(where: string[], params: unknown[], column: string, values: string[]): void {
  if (!values.length) return;
  where.push(`${column} IN (${placeholders(values.length)})`);
  params.push(...values);
}
