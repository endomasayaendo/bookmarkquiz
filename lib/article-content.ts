import * as cheerio from "cheerio";

// 記事 URL の検証と、その HTML からクイズ生成用の本文テキストを取り出す処理をまとめる。
// 「どのサイト・どのパスを記事として受け付けるか」「本文をどう抽出するか」を
// ここに集約し、ルート側はこの関数を呼ぶだけにする。

// 対応サイトの「記事ページ」だけを許可する。ドメイン一致だけだと
// トップページや一覧ページでもブックマークレットが通ってしまうため、
// パスの形まで検証して記事ページに限定する。
const ARTICLE_URL_RULES: { domain: string; path: RegExp }[] = [
  // Qiita 公開記事: /{user}/items/{id}
  { domain: "qiita.com", path: /^\/[^/]+\/items\/[^/]+\/?$/ },
  // Qiita Team（サブドメイン）記事: /posts/{id}
  { domain: "qiita.com", path: /^\/posts\/[^/]+\/?$/ },
  // Zenn 記事: /{user}/articles/{slug}
  { domain: "zenn.dev", path: /^\/[^/]+\/articles\/[^/]+\/?$/ },
];

// URL がホスト名・パス形ともに許可ルールのいずれかに一致するか判定する。
// パースできない URL は false（不正入力は弾く）。
export function isAllowedArticleUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    return ARTICLE_URL_RULES.some(
      (rule) =>
        (hostname === rule.domain || hostname.endsWith(`.${rule.domain}`)) &&
        rule.path.test(pathname)
    );
  } catch {
    return false;
  }
}

// HTML から本文テキストを抽出する。
// ブロック要素の閉じタグ直前に空白を差し込み、隣接ブロックの単語が
// 連結しないようにしてから、スクリプトやナビ等のノイズ要素を除去。
// 最後に空白を畳んで先頭 20000 文字に切り詰める（LLM 入力量の上限対策）。
export function extractBodyText(html: string): string {
  const htmlWithBlockSpacing = html.replace(
    /<\/(article|div|h[1-6]|li|main|p|section)>/gi,
    " </$1>"
  );
  const $ = cheerio.load(htmlWithBlockSpacing);
  $("script, style, nav, header, footer, aside").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);
}

// URL を取得して本文テキストを返す。SSRF・予期しない応答への防御として、
// 許可 URL の再確認・リダイレクト無効化・10秒タイムアウト・HTML 限定を行う。
export async function fetchBodyText(url: string): Promise<string> {
  if (!isAllowedArticleUrl(url)) throw new Error(`Disallowed URL: ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: "manual" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error(`Unexpected content-type: ${contentType}`);
  return extractBodyText(await res.text());
}
