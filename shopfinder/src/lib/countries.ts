// Minimal country name <-> ISO-3166 alpha-2 helper for the markets/origin fields.
const NAME_TO_CODE: Record<string, string> = {
  "united states": "US", usa: "US", "u.s.": "US", "u.s.a.": "US", america: "US",
  "united kingdom": "GB", uk: "GB", "great britain": "GB", britain: "GB", england: "GB",
  canada: "CA", australia: "AU", "new zealand": "NZ",
  germany: "DE", deutschland: "DE", france: "FR", italy: "IT", italia: "IT",
  spain: "ES", espana: "ES", "españa": "ES", netherlands: "NL", holland: "NL",
  belgium: "BE", austria: "AT", switzerland: "CH", sweden: "SE", denmark: "DK",
  norway: "NO", finland: "FI", ireland: "IE", portugal: "PT", poland: "PL",
  czechia: "CZ", "czech republic": "CZ", romania: "RO", hungary: "HU", greece: "GR",
  croatia: "HR", bulgaria: "BG", slovakia: "SK", slovenia: "SI", lithuania: "LT",
  latvia: "LV", estonia: "EE", iceland: "IS", luxembourg: "LU",
  japan: "JP", "south korea": "KR", korea: "KR", singapore: "SG", "hong kong": "HK",
  taiwan: "TW", malaysia: "MY", philippines: "PH", thailand: "TH", indonesia: "ID",
  vietnam: "VN", india: "IN", china: "CN",
  brazil: "BR", brasil: "BR", mexico: "MX", "méxico": "MX", colombia: "CO",
  argentina: "AR", chile: "CL", "south africa": "ZA",
  "united arab emirates": "AE", uae: "AE", "saudi arabia": "SA", israel: "IL",
  turkey: "TR", "türkiye": "TR", turkiye: "TR", nigeria: "NG", egypt: "EG", kenya: "KE",
};

const CODE_TO_NAME: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia", NZ: "New Zealand",
  DE: "Germany", FR: "France", IT: "Italy", ES: "Spain", NL: "Netherlands", BE: "Belgium",
  AT: "Austria", CH: "Switzerland", SE: "Sweden", DK: "Denmark", NO: "Norway", FI: "Finland",
  IE: "Ireland", PT: "Portugal", PL: "Poland", CZ: "Czechia", RO: "Romania", HU: "Hungary",
  GR: "Greece", HR: "Croatia", BG: "Bulgaria", SK: "Slovakia", SI: "Slovenia", LT: "Lithuania",
  LV: "Latvia", EE: "Estonia", IS: "Iceland", LU: "Luxembourg", JP: "Japan", KR: "South Korea",
  SG: "Singapore", HK: "Hong Kong", TW: "Taiwan", MY: "Malaysia", PH: "Philippines",
  TH: "Thailand", ID: "Indonesia", VN: "Vietnam", IN: "India", CN: "China", BR: "Brazil",
  MX: "Mexico", CO: "Colombia", AR: "Argentina", CL: "Chile", ZA: "South Africa",
  AE: "United Arab Emirates", SA: "Saudi Arabia", IL: "Israel", TR: "Turkey", NG: "Nigeria",
  EG: "Egypt", KE: "Kenya",
};

/** ISO-2 code passthrough, or map a country name to its ISO-2 code. */
export function toCountryCode(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return NAME_TO_CODE[s.toLowerCase()] ?? null;
}

/** Display name for an ISO-2 code (falls back to the code itself). */
export function countryName(code?: string | null): string {
  if (!code) return "";
  return CODE_TO_NAME[code.toUpperCase()] ?? code.toUpperCase();
}
