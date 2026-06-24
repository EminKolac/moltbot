import { splitList } from "../lib/util";

const API = "https://api.apify.com/v2";
const TERMINAL = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT", "TIMING-OUT"];

export class ApifyError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApifyError";
    this.status = status;
  }
}

export interface RunActorOptions {
  pollMs?: number;
  timeoutMs?: number;
  /** Pay-per-result cap (passed to the run as maxItems). */
  maxItems?: number;
  memoryMbytes?: number;
  onLog?: (msg: string) => void;
}

/** Comma-separated rotation pool from APIFY_TOKENS. */
export function getTokens(): string[] {
  const t = splitList(process.env.APIFY_TOKENS);
  if (!t.length) {
    throw new ApifyError(
      "No APIFY_TOKENS configured — set them in shopfinder/.env (comma-separated)."
    );
  }
  return t;
}

let rr = 0;

/**
 * Run an Apify actor and return all of its dataset items.
 * Rotates to the next token on auth / rate-limit / quota errors (401/402/403/429).
 */
export async function runActor(
  actor: string,
  input: unknown,
  opts: RunActorOptions = {}
): Promise<unknown[]> {
  const pool = getTokens();
  const log = opts.onLog ?? (() => {});
  let lastErr: unknown;

  for (let attempt = 0; attempt < pool.length; attempt++) {
    const slot = rr++ % pool.length;
    const token = pool[slot];
    const label = `token#${slot + 1}`;
    try {
      return await runWithToken(actor, input, token, label, opts, log);
    } catch (e) {
      lastErr = e;
      const status = e instanceof ApifyError ? e.status : undefined;
      if (status === 401 || status === 402 || status === 403 || status === 429) {
        log(`${label} failed (${status}); rotating token`);
        continue;
      }
      throw e;
    }
  }
  throw lastErr ?? new ApifyError("All Apify tokens failed");
}

async function runWithToken(
  actor: string,
  input: unknown,
  token: string,
  label: string,
  opts: RunActorOptions,
  log: (m: string) => void
): Promise<unknown[]> {
  const pollMs = opts.pollMs ?? 5000;
  const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;

  const startUrl = new URL(`${API}/acts/${actor}/runs`);
  startUrl.searchParams.set("token", token);
  if (opts.maxItems) startUrl.searchParams.set("maxItems", String(opts.maxItems));
  if (opts.memoryMbytes) startUrl.searchParams.set("memory", String(opts.memoryMbytes));

  const startRes = await fetch(startUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  if (!startRes.ok) {
    const body = await startRes.text().catch(() => "");
    throw new ApifyError(`start ${actor} -> ${startRes.status} ${body.slice(0, 200)}`, startRes.status);
  }
  const run = ((await startRes.json()) as { data: ApifyRun }).data;
  log(`${label} started run ${run.id}`);

  const deadline = Date.now() + timeoutMs;
  let status = run.status;
  while (!TERMINAL.includes(status)) {
    if (Date.now() > deadline) throw new ApifyError(`run ${run.id} timed out after ${timeoutMs}ms`);
    await sleep(pollMs);
    const sUrl = new URL(`${API}/actor-runs/${run.id}`);
    sUrl.searchParams.set("token", token);
    const sRes = await fetch(sUrl);
    if (!sRes.ok) throw new ApifyError(`poll ${run.id} -> ${sRes.status}`, sRes.status);
    status = ((await sRes.json()) as { data: ApifyRun }).data.status;
  }
  if (status !== "SUCCEEDED") throw new ApifyError(`run ${run.id} finished as ${status}`);
  log(`${label} run ${run.id} succeeded`);

  return fetchAllItems(run.defaultDatasetId, token);
}

async function fetchAllItems(datasetId: string, token: string): Promise<unknown[]> {
  const items: unknown[] = [];
  const limit = 1000;
  for (let offset = 0; ; offset += limit) {
    const u = new URL(`${API}/datasets/${datasetId}/items`);
    u.searchParams.set("token", token);
    u.searchParams.set("clean", "true");
    u.searchParams.set("format", "json");
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("offset", String(offset));
    const res = await fetch(u);
    if (!res.ok) throw new ApifyError(`items ${datasetId} -> ${res.status}`, res.status);
    const batch = (await res.json()) as unknown[];
    items.push(...batch);
    if (batch.length < limit) break;
  }
  return items;
}

interface ApifyRun {
  id: string;
  status: string;
  defaultDatasetId: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
