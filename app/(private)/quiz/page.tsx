import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const quizSelect = {
    id: true,
    question: true,
    choices: true,
    type: true,
    article: { select: { title: true } },
  };

  const [quizzes, allQuizzes] = await Promise.all([
    prisma.quiz.findMany({
      where: { article: { userId }, quizAnswers: { none: { userId } } },
      select: quizSelect,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.quiz.findMany({
      where: { article: { userId } },
      select: quizSelect,
      orderBy: { createdAt: "desc" },
      take: 10,
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
