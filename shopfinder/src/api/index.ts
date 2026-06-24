import { Hono } from "hono";
import type { DB } from "../db/client";
import { parseFilters } from "./params";
import { getFacets, getStats, getStore, queryStores } from "./service";

/** Build the JSON API (mounted under /api). */
export function createApi(db: DB): Hono {
  const app = new Hono();

  app.get("/api/stores", (c) => {
    const sp = new URL(c.req.url).searchParams;
    return c.json(queryStores(db, parseFilters(sp)));
  });

  app.get("/api/stores/:domain", (c) => {
    const store = getStore(db, c.req.param("domain"));
    if (!store) return c.json({ error: "not found" }, 404);
    return c.json(store);
  });

  app.get("/api/facets", (c) => c.json(getFacets(db)));
  app.get("/api/stats", (c) => c.json(getStats(db)));

  return app;
}
