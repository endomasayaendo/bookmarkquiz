import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBodyText } from "@/lib/article-content";
import { withSession } from "@/lib/api/auth";

// 個別記事の削除(DELETE)と既読/未読トグル(PATCH)を担う API。

type ArticleParams = { params: Promise<{ id: string }> };

// 指定 ID の記事を「本人のものに限定して」取得する。
// userId 条件を必ず付けることで他人の記事を操作できないようにする（認可）。
async function getAuthorizedArticle(id: string, userId: string) {
  return prisma.article.findFirst({ where: { id, userId } });
}

// 記事を削除する。本人の記事でなければ 404。
export const DELETE = withSession<ArticleParams>(async (userId, req, { params }) => {
  const { id } = await params;
  const article = await getAuthorizedArticle(id, userId);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

// 既読/未読を切り替える。未読→既読化のときに本文未取得なら取得して保存し、
// クイズ生成の元データを揃える。本文取得に失敗したらステータスも変えず 502。
export const PATCH = withSession<ArticleParams>(async (userId, req, { params }) => {
  const { id } = await params;
  const article = await getAuthorizedArticle(id, userId);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newStatus = article.status === "unread" ? "done" : "unread";
  // 既読化かつ本文未取得のときだけ取得する（未読へ戻すときは取得不要）。
  let bodyText: string | undefined;
  if (newStatus === "done" && !article.bodyText) {
    try {
      bodyText = await fetchBodyText(article.url);
    } catch {
      return NextResponse.json({ error: "記事本文の取得に失敗しました。時間をおいて再試行してください。" }, { status: 502 });
    }
  }
  const updated = await prisma.article.update({
    where: { id },
    data: {
      status: newStatus,
      readAt: newStatus === "done" ? new Date() : null,
      ...(bodyText !== undefined && { bodyText }),
    },
  });

  return NextResponse.json(updated);
});
