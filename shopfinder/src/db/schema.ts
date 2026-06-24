export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS stores (
  domain             TEXT PRIMARY KEY,
  name               TEXT,
  url                TEXT,
  description        TEXT,
  favicon_url        TEXT,
  platform           TEXT DEFAULT 'shopify',
  created_at         INTEGER,
  created_at_source  TEXT,
  discovered_at      INTEGER,
  last_ingested_at   INTEGER,
  language           TEXT,
  languages          TEXT,
  country            TEXT,
  ships_to_countries TEXT,
  ships_to_source    TEXT,
  currency           TEXT,
  niche              TEXT,
  product_types      TEXT,
  installed_apps     TEXT,
  product_count      INTEGER,
  monthly_visits     INTEGER,
  monthly_revenue_usd INTEGER,
  sample_products    TEXT,
  source_actor       TEXT,
  raw                TEXT
);
CREATE INDEX IF NOT EXISTS idx_stores_created_at     ON stores(created_at);
CREATE INDEX IF NOT EXISTS idx_stores_language       ON stores(language);
CREATE INDEX IF NOT EXISTS idx_stores_country        ON stores(country);
CREATE INDEX IF NOT EXISTS idx_stores_currency       ON stores(currency);
CREATE INDEX IF NOT EXISTS idx_stores_niche          ON stores(niche);
CREATE INDEX IF NOT EXISTS idx_stores_product_count  ON stores(product_count);
CREATE INDEX IF NOT EXISTS idx_stores_last_ingested  ON stores(last_ingested_at);
`;
