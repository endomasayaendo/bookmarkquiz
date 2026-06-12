import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSession } from "@/lib/api/auth";

// クイズへの回答を受け付け、正誤判定と解説を返す API。
// 採点はサーバー側で行い（answer はクライアントに渡していない）、
// 回答履歴(QuizAnswer)を記録する。
export const POST = withSession<{ params: Promise<{ id: string }> }>(
  async (userId, req, { params }) => {
    const { id } = await params;
    const { selectedIndex } = await req.json();

    if (typeof selectedIndex !== "number") {
      return NextResponse.json({ error: "selectedIndex is required" }, { status: 400 });
    }

    // 本人の記事に紐づくクイズに限定して取得（他人のクイズには回答させない）。
    const quiz = await prisma.quiz.findFirst({
      where: { id, article: { userId } },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const isCorrect = quiz.answer === selectedIndex;

    await prisma.quizAnswer.create({
      data: { userId, quizId: id, isCorrect },
    });

    return NextResponse.json({
      isCorrect,
      correctIndex: quiz.answer,
      explanation: quiz.explanation,
    });
  }
);
