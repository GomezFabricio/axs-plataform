import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const DIR_CMS = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@payload-config": path.resolve(DIR_CMS, "payload.config.ts"),
      "@": path.resolve(DIR_CMS, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: "tests/soporte/preparacionGlobal.ts",
    setupFiles: ["tests/soporte/preparacionArchivo.ts"],
    pool: "forks",
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
