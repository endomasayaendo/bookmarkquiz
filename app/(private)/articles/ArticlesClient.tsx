"use client";

import { useRouter } from "next/navigation";
import { callApi } from "@/lib/client/api";
import { useApiAction } from "@/hooks/useApiAction";
import type { Article } from "./article-style";
import ArticleListItem from "./ArticleListItem";

type Props = {
  articles: Article[];
};

// 記事一覧の操作を担うクライアントコンポーネント。
// 既読/未読トグル・削除を API に投げ、成功したらサーバーコンポーネントを
// 再取得(refresh)して最新状態を反映する。表示は ArticleListItem に委譲する。
export default function ArticlesClient({ articles }: Props) {
  const router = useRouter();
  const { isPending, run } = useApiAction();

  // サーバーコンポーネントを再実行して一覧を最新化する。
  function refresh() {
    run(() => router.refresh());
  }

  // 既読/未読を切り替える。本文取得失敗(502)などはサーバーのメッセージを表示。
  async function handleToggle(id: string) {
    const { ok, error } = await callApi(`/api/articles/${id}`, { method: "PATCH" });
    if (!ok) {
      alert(error ?? "ステータスの更新に失敗しました");
      return;
    }
    refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    await callApi(`/api/articles/${id}`, { method: "DELETE" });
    refresh();
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-400">記事がありません</p>
      </div>
    );
  }

  return (
    <ul className={`space-y-3 ${isPending ? "opacity-60" : ""}`}>
      {articles.map((article) => (
        <ArticleListItem
          key={article.id}
          article={article}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}
