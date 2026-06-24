export const fmtDate = (ms: number | null): string =>
  ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export const fmtYear = (ms: number | null): string =>
  ms ? String(new Date(ms).getFullYear()) : "—";

export const fmtInt = (n: number | null | undefined): string =>
  n == null ? "—" : new Intl.NumberFormat().format(n);

export function fmtMoney(n: number | null | undefined, currency = "USD"): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${new Intl.NumberFormat().format(n)} ${currency ?? ""}`.trim();
  }
}

export function timeAgo(ms: number | null): string {
  if (!ms) return "never";
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
