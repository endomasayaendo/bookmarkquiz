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

        <ArticlesClient articles={articles} />
      </div>
    </div>
  );
}
