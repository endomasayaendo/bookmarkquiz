import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QuizClient from "./QuizClient";

import { QUIZ_LIMIT, recentQuizWhere, unansweredQuizWhere, type QuizItem } from "./config";

// クイズ画面のサーバーコンポーネント。出題データを DB から取得して
// クライアント(QuizClient)へ渡す。正解(answer)・解説は採点時に
// API から受け取るため、ここでは送らない。
export default async function QuizPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const quizSelect = {
    id: true,
    question: true,
    choices: true,
    type: true,
    article: { select: { title: true } },
  };

  const recentWhere = recentQuizWhere(userId);

  // quizzes  : 未回答のみ（通常出題）／ allQuizzes : 直近全部（復習モード用）。
  const [quizzes, allQuizzes] = await Promise.all([
    prisma.quiz.findMany({
      where: unansweredQuizWhere(userId),
      select: quizSelect,
      orderBy: { createdAt: "desc" },
      take: QUIZ_LIMIT,
    }),
    prisma.quiz.findMany({
      where: recentWhere,
      select: quizSelect,
      orderBy: { createdAt: "desc" },
      take: QUIZ_LIMIT,
    }),
  ]);

  const allAnswered = allQuizzes.length > 0 && quizzes.length === 0;

  return <QuizClient quizzes={quizzes as QuizItem[]} allQuizzes={allQuizzes as QuizItem[]} allAnswered={allAnswered} />;
}
