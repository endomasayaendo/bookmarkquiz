"use client";

import type { Article } from "./article-style";
import {
  articleHostname,
  articleBorderClass,
  toggleButtonClass,
  toggleButtonLabel,
} from "./article-style";

type Props = {
  article: Article;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string) => void;
};

// 記事一覧の1件分の表示。操作（トグル・削除）は親から渡されたコールバックに委譲し、
// 自身は表示とイベントの中継だけを担う（fetch やリフレッシュは持たない）。
export default function ArticleListItem({ article, onToggle, onDelete }: Props) {
  const hostname = articleHostname(article.url);

  return (
    <li className={`rounded-2xl bg-white p-4 shadow-sm border-l-4 ${articleBorderClass(article.status)}`}>
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
            onClick={() => onToggle(article.id)}
            className={`rounded border px-2 py-0.5 text-xs transition-colors ${toggleButtonClass(article.status)}`}
          >
            {toggleButtonLabel(article.status)}
          </button>

          <button
            onClick={() => onDelete(article.id, article.title)}
            className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-400 hover:border-red-400 hover:text-red-600"
          >
            削除
          </button>
        </div>
      </div>
    </li>
  );
}
