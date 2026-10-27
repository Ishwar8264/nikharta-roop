import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest configuration.
 *
 * Why:
 * Vitest doesn't read tsconfig `paths` by default, so we redeclare the `@/`
 * alias here. The `server-only` marker package isn't installed as a real
 * dependency (Next handles it at build time), so we stub it to an empty
 * module — in the test environment every module runs in Node, so the marker
 * has no behaviour to enforce.
 *
 * Test files import the unit under test via a **relative** path (no `@/`),
 * which keeps each test's intent explicit and decouples them from the path
 * alias.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.ts"],
    },
  },
});
