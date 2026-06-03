import { test, expect } from "@playwright/test";
import { devLogin } from "./helpers";

test("Dev Loginからオンボーディングを完了してダッシュボードに到達できる", async ({ page }) => {
  await devLogin(page);

  // 未オンボーディングなのでオンボ画面へ遷移する
  await expect(page.getByRole("heading", { name: "はじめる前に" })).toBeVisible();

  // チェックを入れると「はじめる」が活性化する
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "はじめる" }).click();

  // ダッシュボードに到達
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
});
