// 対応サイトの「記事ページ」だけを許可する URL ルールと、その判定。
// 「どのサイト・どのパスを記事として受け付けるか」だけを担い、
// HTML 取得・本文抽出とは分離する。サイトを増やすときは
// ARTICLE_URL_RULES に1行追加するだけでよい（拡張に開いている）。

// ドメイン一致だけだとトップページや一覧でもブックマークレットが通るため、
// パスの形まで検証して記事ページに限定する。
export const ARTICLE_URL_RULES: { domain: string; path: RegExp }[] = [
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
