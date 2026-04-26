import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status } = await searchParams;
  const filter = status === "unread" || status === "done" ? status : undefined;

  const articles = await prisma.article.findMany({
    where: {
      userId: session!.user!.id,
      ...(filter ? { status: filter } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, url: true, status: true, createdAt: true, readAt: true },
  });

  const heading = filter === "unread" ? "未読" : filter === "done" ? "読んだ" : "すべての記事";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← ダッシュボード
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-400">記事がありません</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {articles.map((article) => {
              let hostname = "";
              try {
                hostname = new URL(article.url).hostname;
              } catch {}

              return (
                <li key={article.id}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="mb-1 text-sm font-medium text-gray-900 line-clamp-2">
                      {article.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{hostname}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          article.status === "done"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {article.status === "done" ? "読んだ" : "未読"}
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
