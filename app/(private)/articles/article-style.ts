// 記事1件の表示に使う型と、ステータス由来のスタイル/表示文言を決める純粋関数。
// レンダリング(ArticleListItem)から切り離すことで、ロジックを単体テストできる。

export type Article = {
  id: string;
  title: string;
  url: string;
  status: string;
  createdAt: Date;
  ogpImage: string | null;
};

// 表示用にホスト名だけ取り出す。不正 URL でも落とさず空文字を返す。
export function articleHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// カード左端のボーダー色（既読=緑 / 未読=青）。
export function articleBorderClass(status: string): string {
  return status === "done" ? "border-green-400" : "border-blue-400";
}

// 既読/未読トグルボタンのスタイル（既読なら「未読に戻す」=青系、未読なら「読んだ」=緑系）。
export function toggleButtonClass(status: string): string {
  return status === "done"
    ? "border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800"
    : "border-green-300 text-green-600 hover:border-green-500 hover:text-green-800";
}

// トグルボタンの表示文言。
export function toggleButtonLabel(status: string): string {
  return status === "done" ? "未読に戻す" : "読んだにする";
}
