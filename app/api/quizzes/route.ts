import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSession } from "@/lib/api/auth";

// ログインユーザーのクイズ一覧を返す。
// 出題前の取得なので answer（正解）と explanation は select に含めない。
export const GET = withSession(async (userId) => {
  const quizzes = await prisma.quiz.findMany({
    where: { article: { userId } },
    select: {
      id: true,
      articleId: true,
      question: true,
      choices: true,
      type: true,
      createdAt: true,
      article: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quizzes);
});
