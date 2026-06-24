import { existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { loadEnv } from "./lib/env";
import { getDb } from "./db/client";
import { createApi } from "./api";

loadEnv();

const db = getDb();
const app = createApi(db);

// In production, serve the built dashboard. In dev, Vite serves the UI and proxies /api here.
const DIST = "web/dist";
if (existsSync(DIST)) {
  app.use("/*", serveStatic({ root: DIST }));
  // SPA fallback for client-side routes.
  app.get("*", serveStatic({ path: `${DIST}/index.html` }));
} else {
  app.get("/", (c) =>
    c.text("ShopFinder API is running. Run `npm run dev` (UI on :5173) or `npm run build` first.")
  );
}

const port = Number(process.env.PORT || 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[shopfinder] API + UI on http://localhost:${info.port}`);
});
