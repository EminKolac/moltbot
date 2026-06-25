import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runActor } from "../src/ingest/apify";

/** Minimal fetch Response stub. */
const ok = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => data,
  text: async () => "",
});

// A run that starts already in a terminal state, so runActor skips the poll loop
// and exercises the post-run salvage branch directly (no sleeps).
const startedAs = (status: string, datasetId: string, items: unknown[]) =>
  vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.includes("/acts/")) return ok({ data: { id: "run1", status, defaultDatasetId: datasetId } });
    if (u.includes(`/datasets/${datasetId}/items`)) return ok(items);
    throw new Error(`unexpected fetch: ${u}`);
  });

describe("runActor", () => {
  beforeEach(() => {
    process.env.APIFY_TOKENS = "tok_test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.APIFY_TOKENS;
  });

  it("salvages dataset items when the run finishes non-SUCCEEDED but produced items", async () => {
    // The Shopify analyzer reproducibly exits FAILED (code 91) yet writes a full dataset.
    vi.stubGlobal("fetch", startedAs("FAILED", "ds1", [{ domain: "a.com" }]));
    const items = await runActor("user~actor", { mode: "x" });
    expect(items).toEqual([{ domain: "a.com" }]);
  });

  it("throws when a non-SUCCEEDED run produced no items", async () => {
    vi.stubGlobal("fetch", startedAs("FAILED", "ds2", []));
    await expect(runActor("user~actor", { mode: "x" })).rejects.toThrow(/finished as FAILED/);
  });
});
