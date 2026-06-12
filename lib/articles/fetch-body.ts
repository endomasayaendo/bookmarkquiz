import { isAllowedArticleUrl } from "./url-rules";
import { extractBodyText } from "./extract";

// URL を取得して本文テキストを返す。URL 検証と本文抽出を組み合わせるだけの
// オーケストレーション層で、ネットワーク I/O はここに閉じる。
// SSRF・予期しない応答への防御として、許可 URL の再確認・リダイレクト無効化・
// 10秒タイムアウト・HTML 限定を行う。
// fetchFn を差し替え可能にしてテスト時に注入できるが、未指定時は
// 呼び出し時にグローバル fetch を解決する（vi.stubGlobal を効かせるため）。
export async function fetchBodyText(url: string, fetchFn?: typeof fetch): Promise<string> {
  if (!isAllowedArticleUrl(url)) throw new Error(`Disallowed URL: ${url}`);
  const doFetch = fetchFn ?? fetch;
  const res = await doFetch(url, { signal: AbortSignal.timeout(10000), redirect: "manual" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error(`Unexpected content-type: ${contentType}`);
  return extractBodyText(await res.text());
}
