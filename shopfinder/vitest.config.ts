import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Scope vitest to this app so it does not climb to the parent moltbot config.
export default defineConfig({
  root: ".",
  plugins: [react()],
  test: {
    // .ts suites run in node; the .tsx UI smoke test opts into happy-dom via a
    // per-file `// @vitest-environment happy-dom` docblock at the top of the file.
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    environment: "node",
  },
});
