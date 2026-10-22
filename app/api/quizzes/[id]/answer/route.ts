import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSession } from "@/lib/api/auth";
import { readJsonObject } from "@/lib/api/request";

// クイズへの回答を受け付け、正誤判定と解説を返す API。
// 採点はサーバー側で行い（answer はクライアントに渡していない）、
// 回答履歴(QuizAnswer)を記録する。
export const POST = withSession<{ params: Promise<{ id: string }> }>(
  async (userId, req, { params }) => {
    const { id } = await params;
    const body = await readJsonObject(req);
    const selectedIndex = body?.selectedIndex;

    // 0 以上の整数のみ受け付ける（範囲の上限はクイズ取得後に選択肢数で確認）。
    if (typeof selectedIndex !== "number" || !Number.isInteger(selectedIndex) || selectedIndex < 0) {
      return NextResponse.json({ error: "selectedIndex is required" }, { status: 400 });
    }

    // 本人の記事に紐づくクイズに限定して取得（他人のクイズには回答させない）。
    const quiz = await prisma.quiz.findFirst({
      where: { id, article: { userId } },
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // 存在しない選択肢への回答は履歴に残さず弾く。
    const choiceCount = Array.isArray(quiz.choices) ? quiz.choices.length : 0;
    if (choiceCount === 0) console.warn(`Quiz ${quiz.id} has invalid choices data`);
    if (selectedIndex >= choiceCount) {
      return NextResponse.json({ error: "selectedIndex is out of range" }, { status: 400 });
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
