import { defineConfig } from "vitest/config";

// Scope vitest to this app so it does not climb to the parent moltbot config.
export default defineConfig({
  root: ".",
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
