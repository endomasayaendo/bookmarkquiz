import * as cheerio from "cheerio";

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

export function extractBodyText(html: string): string {
  const htmlWithBlockSpacing = html.replace(
    /<\/(article|div|h[1-6]|li|main|p|section)>/gi,
    " </$1>"
  );
  const $ = cheerio.load(htmlWithBlockSpacing);
  $("script, style, nav, header, footer, aside").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);
}

export async function fetchBodyText(url: string): Promise<string> {
  if (!isAllowedArticleUrl(url)) throw new Error(`Disallowed URL: ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: "manual" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error(`Unexpected content-type: ${contentType}`);
  return extractBodyText(await res.text());
}
