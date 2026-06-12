import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { parseQuizzes } from "@/lib/quiz-parser";

// 直近に既読化された記事から LLM で4択クイズを生成する業務ロジック。
// cron ルートからこの関数を呼ぶだけにし、認証・HTTP の関心とは分離する。
// LLM クライアントは引数で差し替え可能（テスト時に fake を注入し env 不要に）。

export type QuizGenerationResult = {
  generated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
};

// Groq SDK のうち本サービスが必要とする最小インターフェースだけを型にする。
// これにより groq-sdk 全体ではなく構造的にこの形を満たす任意の実装を注入できる。
export type QuizLlm = {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: { role: "user"; content: string }[];
        temperature: number;
      }) => Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
};

// 記事タイトルと本文から、JSON 配列のみを返すよう指示する LLM プロンプト。
export const QUIZ_PROMPT = (title: string, body: string) => `
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

export async function generateQuizzesForRecentArticles(
  opts: { llm?: QuizLlm } = {}
): Promise<QuizGenerationResult> {
  // llm 未指定時のみ実クライアントを生成（テスト時は env 不要にするため遅延生成）。
  const llm = opts.llm ?? new Groq({ apiKey: process.env.GROQ_API_KEY });

  // 対象は「直近24時間に既読化され・本文があり・まだクイズ未生成」の記事。
  // quizzes: { none: {} } で重複生成を防ぐ。
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

  const results: QuizGenerationResult = {
    generated: 0,
    skipped: 0,
    errors: 0,
    errorMessages: [],
  };

  // 記事ごとに生成。1件失敗しても他は続行できるよう try/catch で個別に集計する。
  for (const article of articles) {
    try {
      // LLM 入力トークン量を抑えるため本文は先頭 8000 文字までに制限。
      const prompt = QUIZ_PROMPT(article.title, article.bodyText!.slice(0, 8000));
      const completion = await llm.chat.completions.create({
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

  return results;
}
