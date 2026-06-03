import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // ユニット/結合テストのみ対象。e2e/ の *.spec.ts は Playwright が実行するので除外。
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
