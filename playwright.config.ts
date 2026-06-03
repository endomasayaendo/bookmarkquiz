import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// DATABASE_URL をテスト用DB（docker-compose.test.yml）に差し替える。
// dotenv は既存の process.env を上書きしないので、これ以降に起動する
// next dev / prisma db push もすべてテストDBを向く。
dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // demoユーザー1人のDB状態を共有するため、直列実行で干渉を避ける。
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // 実dev鯖(3000/本番DB)と混ざらないよう専用ポートで起動する。
    command: "npm run dev -- -p 3100",
    // /login は DB 非依存なので、schema投入前の起動待ちでも安全。
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
