import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const session = await auth();

  const quizzes = await prisma.quiz.findMany({
    where: { article: { userId: session!.user!.id } },
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

  return <QuizClient quizzes={quizzes as QuizItem[]} />;
}

export type QuizItem = {
  id: string;
  question: string;
  choices: string[];
  type: string;
  article: { title: string };
};
