import { test, expect } from "@playwright/test";
import { devLogin } from "./helpers";

test("クイズに正解して結果画面まで進める", async ({ page }) => {
  await devLogin(page);
  await page.goto("/quiz");

  // seed済みのクイズが表示される
  await expect(page.getByText("BookmarkQuizは何から生成される？")).toBeVisible();

  // 正解の選択肢（index = 1）を選ぶ
  await page.getByRole("button", { name: "クイズ", exact: true }).click();
  await expect(page.getByText("正解！")).toBeVisible();

  // 結果画面へ
  await page.getByRole("button", { name: "結果を見る" }).click();
  await expect(page.getByText("正解数")).toBeVisible();
});
