import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QuizClient from "./QuizClient";

import { QUIZ_LOOKBACK_DAYS, QUIZ_LIMIT } from "./config";

export default async function QuizPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const since = new Date();
  since.setDate(since.getDate() - QUIZ_LOOKBACK_DAYS);

  const quizSelect = {
    id: true,
    question: true,
    choices: true,
    type: true,
    article: { select: { title: true } },
  };

  const recentWhere = { article: { userId }, createdAt: { gte: since } };

  const [quizzes, allQuizzes] = await Promise.all([
    prisma.quiz.findMany({
      where: { ...recentWhere, quizAnswers: { none: { userId } } },
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

export type QuizItem = {
  id: string;
  question: string;
  choices: string[];
  type: string;
  article: { title: string };
};
