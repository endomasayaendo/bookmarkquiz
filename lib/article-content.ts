import * as cheerio from "cheerio";

export const ALLOWED_ARTICLE_DOMAINS = ["qiita.com", "zenn.dev"] as const;

export function isAllowedArticleUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_ARTICLE_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
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
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error(`Unexpected content-type: ${contentType}`);
  return extractBodyText(await res.text());
}
