import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": path.join(root, "tests/shims/cloudflare-workers.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
