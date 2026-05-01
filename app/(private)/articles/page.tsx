import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ArticlesClient from "./ArticlesClient";

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
    select: { id: true, title: true, url: true, status: true, createdAt: true, readAt: true, ogpImage: true },
  });

  const heading = filter === "unread" ? "未読" : filter === "done" ? "読んだ" : "すべての記事";
  const headingColor =
    filter === "unread" ? "text-blue-600" : filter === "done" ? "text-green-600" : "text-gray-900";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard" className="mb-4 block text-sm text-gray-400 hover:text-gray-600">
            ← ダッシュボード
          </Link>
          <div className="flex gap-2">
            <Link
              href="/articles?status=unread"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              未読
            </Link>
            <Link
              href="/articles?status=done"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === "done"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              読んだ
            </Link>
          </div>
          <h1 className={`mt-3 text-xl font-bold ${headingColor}`}>
            {heading}
            <span className="ml-2 text-base font-normal text-gray-400">{articles.length}件</span>
          </h1>
        </div>

        <ArticlesClient articles={articles} />
      </div>
    </div>
  );
}
