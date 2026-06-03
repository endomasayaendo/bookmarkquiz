import { type Page } from "@playwright/test";

// 開発限定の「Dev Login」でデモユーザーとしてログインする。
// ログイン後はリダイレクトで /login を離れるまで待つ。
export async function devLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Dev Login（開発用）" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"));
}
