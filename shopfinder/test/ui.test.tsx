// @vitest-environment happy-dom
//
// End-to-end UI smoke test with no browser binary required.
// It mounts the REAL <App/> in a simulated DOM (happy-dom) and routes the
// frontend's relative `/api/*` fetches into the REAL in-process Hono API,
// which reads from a real in-memory SQLite DB seeded from the tracked sample
// dataset. This exercises the whole loop: render -> fetch -> filter -> re-render.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { openDb } from "../src/db/client";
import { upsertStores } from "../src/db/repo";
import { mapItems } from "../src/ingest/map";
import { createApi } from "../src/api/index";
import { App } from "../web/src/App";

// Real in-memory DB seeded from data/sample-items.json via the real mapper + repo.
const items = JSON.parse(readFileSync(resolve("data/sample-items.json"), "utf8")) as unknown[];
const db = openDb(":memory:");
const seededCount = upsertStores(
  db,
  mapItems("apivault", items, "apivault_labs~shopify-store-analyzer"),
);
const api = createApi(db);

let origFetch: typeof globalThis.fetch;

beforeAll(() => {
  origFetch = globalThis.fetch;
  // The UI calls fetch("/api/stores?..."), fetch("/api/facets"), etc. with
  // relative URLs. Route those straight into the in-process Hono app.
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    return api.request(path, init);
  }) as typeof globalThis.fetch;
});

afterAll(() => {
  globalThis.fetch = origFetch;
});

// URL-synced filters mean a prior test can leave ?language=... in the address;
// reset it so each App mounts with a clean filter state.
beforeEach(() => {
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  cleanup();
});

const cards = () => document.querySelectorAll(".grid .card");

test("sample dataset maps to 6 stores", () => {
  expect(seededCount).toBe(6);
});

test("dashboard renders all seeded stores from the live API", async () => {
  render(<App />);
  // Grid populates only after GET /api/stores resolves through the real API.
  expect(await screen.findByText("North Peak Coffee Roasters")).toBeTruthy();
  await waitFor(() => expect(cards().length).toBe(6));
  // Representative names across niches / languages.
  expect(screen.getByText("Maison Belle")).toBeTruthy();
  expect(screen.getByText("Kleine Wolke Home")).toBeTruthy();
});

test("language filter re-queries the API and narrows the grid", async () => {
  render(<App />);
  await waitFor(() => expect(cards().length).toBe(6));

  // Facet checkboxes render after GET /api/facets; lowercase "fr" is unique to
  // the Language facet (card chips render languages uppercased).
  const fr = await screen.findByText("fr", { selector: "span.facet-value" });
  const checkbox = fr
    .closest("label")
    ?.querySelector('input[type="checkbox"]') as HTMLInputElement;
  fireEvent.click(checkbox);

  // GET /api/stores?language=fr -> exactly one French store (Maison Belle).
  await waitFor(() => expect(cards().length).toBe(1));
  expect(screen.getByText("Maison Belle")).toBeTruthy();
  expect(screen.queryByText("North Peak Coffee Roasters")).toBeNull();
});

test("clicking a store card opens the detail drawer", async () => {
  render(<App />);
  const card = (await screen.findByText("North Peak Coffee Roasters")).closest(
    ".card",
  ) as HTMLElement;
  fireEvent.click(card);

  // Drawer mounts with the full record + sample products.
  await waitFor(() => expect(document.querySelector(".drawer")).toBeTruthy());
  expect(screen.getByText("Sunrise Blend (12oz)")).toBeTruthy(); // a northpeak sample product
});
