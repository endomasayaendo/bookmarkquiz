import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const quizzes = await prisma.quiz.findMany({
    where: { article: { userId } },
    select: {
      id: true,
      question: true,
      choices: true,
      type: true,
      article: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const unansweredCount = await prisma.quiz.count({
    where: {
      article: { userId },
      quizAnswers: { none: { userId } },
    },
  });

  const allAnswered = quizzes.length > 0 && unansweredCount === 0;

  return <QuizClient quizzes={quizzes as QuizItem[]} allAnswered={allAnswered} />;
}

export type QuizItem = {
  id: string;
  question: string;
  choices: string[];
  type: string;
  article: { title: string };
};
