"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Article = {
  id: string;
  title: string;
  url: string;
  status: string;
  createdAt: Date;
  ogpImage: string | null;
};

type Props = {
  articles: Article[];
};

export default function ArticlesClient({ articles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => { router.refresh(); });
  }

  async function handleToggle(id: string) {
    await fetch(`/api/articles/${id}`, { method: "PATCH" });
    refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
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
      {articles.map((article) => {
        let hostname = "";
        try { hostname = new URL(article.url).hostname; } catch {}

        return (
          <li key={article.id} className={`rounded-2xl bg-white p-4 shadow-sm border-l-4 ${article.status === "done" ? "border-green-400" : "border-blue-400"}`}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 flex gap-3 hover:opacity-80 transition-opacity"
            >
              {article.ogpImage && (
                <img
                  src={article.ogpImage}
                  alt=""
                  className="h-40 w-60 flex-shrink-0 rounded-lg object-contain bg-gray-100"
                />
              )}
              <span className="text-sm font-medium text-gray-900 line-clamp-3">
                {article.title}
              </span>
            </a>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{hostname}</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(article.id)}
                  className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                    article.status === "done"
                      ? "border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-800"
                      : "border-green-300 text-green-600 hover:border-green-500 hover:text-green-800"
                  }`}
                >
                  {article.status === "done" ? "未読に戻す" : "読んだにする"}
                </button>

                <button
                  onClick={() => handleDelete(article.id, article.title)}
                  className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-400 hover:border-red-400 hover:text-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
