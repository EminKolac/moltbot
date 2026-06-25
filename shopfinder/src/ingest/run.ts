import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { loadEnv } from "../lib/env";
import { splitList, up } from "../lib/util";
import { getDb } from "../db/client";
import { countStores, upsertStores } from "../db/repo";
import { runActor } from "./apify";
import { actorFor, inputFor, type DiscoverParams, type SourceName } from "./sources";
import { mapItems } from "./map";

loadEnv();

const USAGE = `
ShopFinder ingest — pull Shopify stores from Apify into the local DB.

  npm run ingest -- --terms "organic coffee,yoga mats" [--max 25] [--country US] [--source apivault|clearpath] [--ships-to US] [--save data/raw.json]
  npm run ingest -- --file data/dataset.json        # import a saved Apify dataset (array of items)

Options:
  --terms      Comma-separated search terms / niches (required unless --file)
  --max        Max stores to discover (default 25)
  --country    ISO-2 country-of-origin bias (e.g. US, GB, DE)
  --ships-to   ISO-2 ships-to country (clearpath source only)
  --source     apivault (default, full analysis) or clearpath (ships-to discovery)
  --file       Import items from a JSON file instead of calling Apify
  --save       Write the raw fetched/loaded items to a JSON file (before mapping)
`;

async function main() {
  const { values } = parseArgs({
    options: {
      source: { type: "string", default: "apivault" },
      terms: { type: "string" },
      country: { type: "string" },
      "ships-to": { type: "string" },
      max: { type: "string", default: "25" },
      file: { type: "string" },
      save: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  const source = (values.source as SourceName) ?? "apivault";
  const terms = splitList(values.terms);
  const max = Math.max(1, Number(values.max) || 25);
  const country = up(values.country) ?? undefined;
  const shipsTo = up(values["ships-to"]) ?? undefined;
  const actor = actorFor(source);

  if (!terms.length && !values.file) {
    console.error("Error: provide --terms (or --file to import a saved dataset).\n" + USAGE);
    process.exitCode = 1;
    return;
  }

  const started = Date.now();
  let items: unknown[];

  if (values.file) {
    const raw = await readFile(resolve(values.file), "utf8");
    const parsed: unknown = JSON.parse(raw);
    items = Array.isArray(parsed) ? parsed : [parsed];
    console.log(`[ingest] loaded ${items.length} items from ${values.file}`);
  } else {
    const params: DiscoverParams = { terms, country, shipsTo, max };
    const input = inputFor(source, params);
    console.log(
      `[ingest] source=${source} actor=${actor} terms=${JSON.stringify(terms)} max=${max}` +
        (country ? ` country=${country}` : "") +
        (shipsTo ? ` shipsTo=${shipsTo}` : "")
    );
    items = await runActor(actor, input, {
      onLog: (m) => console.log(`[apify] ${m}`),
      timeoutMs: 15 * 60 * 1000,
    });
    console.log(`[ingest] actor returned ${items.length} raw items`);
  }

  if (values.save) {
    const out = resolve(values.save);
    await writeFile(out, JSON.stringify(items, null, 2));
    console.log(`[ingest] saved ${items.length} raw items to ${values.save}`);
  }

  const stores = mapItems(source, items, actor, {
    shipsTo,
    country,
    niche: terms.join(", ") || undefined,
  });

  const db = getDb();
  const written = upsertStores(db, stores);
  const secs = ((Date.now() - started) / 1000).toFixed(0);

  console.log(
    `[ingest] mapped ${stores.length} stores, upserted ${written} (db now has ${countStores(db)}) in ${secs}s`
  );
  if (!values.file) {
    console.log(`[ingest] approx Apify cost: ~$${(stores.length * 0.004).toFixed(3)}`);
  }
  for (const s of stores.slice(0, 8)) {
    console.log(
      `  • ${s.domain} | created=${s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : "—"} | lang=${s.language ?? "—"} | shipsTo=${s.ships_to_countries.join("/") || "—"} | niche=${s.niche ?? "—"} | products=${s.product_count ?? "—"}`
    );
  }
}

main().catch((err) => {
  console.error("[ingest] failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
