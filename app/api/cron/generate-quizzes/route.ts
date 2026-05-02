import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROMPT = (title: string, body: string) => `
以下の記事から4択クイズを3問作成してください。
記事タイトル: ${title}
記事本文:
${body}

以下のJSON配列形式のみで返してください（他のテキスト不要）:
[
  {
    "question": "問題文",
    "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "answer": 0,
    "explanation": "解説文"
  }
]
answerは正解の選択肢のインデックス（0〜3）です。
`;

type QuizItem = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

function parseQuizzes(text: string): QuizItem[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  return JSON.parse(match[0]) as QuizItem[];
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("Authorization");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      status: "done",
      readAt: { gte: since },
      bodyText: { not: null },
      quizzes: { none: {} },
    },
    select: { id: true, title: true, bodyText: true },
  });

  const results: { generated: number; skipped: number; errors: number; errorMessages: string[] } = { generated: 0, skipped: 0, errors: 0, errorMessages: [] };

  for (const article of articles) {
    try {
      const prompt = PROMPT(article.title, article.bodyText!.slice(0, 8000));
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      const text = completion.choices[0].message.content ?? "";
      const quizzes = parseQuizzes(text);

      await prisma.quiz.createMany({
        data: quizzes.map((q) => ({
          articleId: article.id,
          question: q.question,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation,
          type: "daily",
        })),
      });

      results.generated += quizzes.length;
    } catch (e) {
      results.errors++;
      results.errorMessages.push(e instanceof Error ? e.message : String(e));
    }
  }

  return NextResponse.json(results);
}
