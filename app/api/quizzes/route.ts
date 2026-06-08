import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ログインユーザーのクイズ一覧を返す。?type=daily|weekly で絞り込み可能。
// 出題前の取得なので answer（正解）と explanation は select に含めない。
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "daily" | "weekly" | null;

  const quizzes = await prisma.quiz.findMany({
    where: {
      article: { userId: session.user.id },
      ...(type ? { type } : {}),
    },
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
}
