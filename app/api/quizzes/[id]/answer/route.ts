import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { selectedIndex } = await req.json();

  if (typeof selectedIndex !== "number") {
    return NextResponse.json({ error: "selectedIndex is required" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const isCorrect = quiz.answer === selectedIndex;

  await prisma.quizAnswer.create({
    data: {
      userId: session.user.id,
      quizId: id,
      isCorrect,
    },
  });

  return NextResponse.json({
    isCorrect,
    correctIndex: quiz.answer,
    explanation: quiz.explanation,
  });
}
