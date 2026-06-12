import * as cheerio from "cheerio";

// HTML 文字列から本文テキストを抽出する純粋ロジック（I/O を持たない）。
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
