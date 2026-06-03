import { test, expect } from "@playwright/test";
import { devLogin } from "./helpers";

test("「読んだ」記事が一覧に表示され、未読に戻せる", async ({ page }) => {
  await devLogin(page);
  await page.goto("/articles?status=done");

  // seed済みの「読んだ」記事が表示される
  await expect(page.getByText("E2Eテスト用の記事")).toBeVisible();

  // 「未読に戻す」と done フィルタから消える
  await page.getByRole("button", { name: "未読に戻す" }).click();
  await expect(page.getByText("記事がありません")).toBeVisible();
});
