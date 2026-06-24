/** Strip protocol/www/path/port and lowercase -> bare registrable host. */
export function normalizeDomain(input?: string | null): string | null {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  s = s.replace(/:\d+$/, "");
  return s || null;
}

/** Parse a date (ISO string, epoch s, or epoch ms) into epoch ms. */
export function toEpoch(d?: string | number | null): number | null {
  if (d == null || d === "") return null;
  if (typeof d === "number") return d > 1e12 ? d : d * 1000;
  const t = Date.parse(String(d));
  return Number.isNaN(t) ? null : t;
}

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((x): x is T => x != null && x !== "");
}

export function up(s?: string | null): string | null {
  return s ? String(s).trim().toUpperCase() : null;
}

export function low(s?: string | null): string | null {
  return s ? String(s).trim().toLowerCase() : null;
}

/** "en-US" -> "en". */
export function langBase(s?: string | null): string | null {
  const l = low(s);
  return l ? l.split(/[-_]/)[0] || null : null;
}

/** "en-us" -> "US". */
export function countryFromHreflang(s?: string | null): string | null {
  const m = low(s)?.match(/[-_]([a-z]{2})$/);
  return m ? m[1].toUpperCase() : null;
}

/** Keep values that look like ISO-3166 alpha-2 codes, uppercased. */
export function asCountryCode(s?: string | null): string | null {
  const u = up(s);
  return u && /^[A-Z]{2}$/.test(u) ? u : null;
}

export function asNumber(n: unknown): number | null {
  if (n == null || n === "") return null;
  const v = typeof n === "number" ? n : Number(String(n).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(v) ? v : null;
}

export function jsonParse<T>(s: unknown, fallback: T): T {
  if (s == null) return fallback;
  if (typeof s !== "string") return (s as T) ?? fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Split a CSV-ish string into trimmed non-empty parts. */
export function splitList(s?: string | null): string[] {
  if (!s) return [];
  return compact(String(s).split(",").map((x) => x.trim()));
}
