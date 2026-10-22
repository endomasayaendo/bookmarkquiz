import { prisma } from "@/lib/prisma";
import { unansweredQuizWhere } from "@/app/(private)/quiz/config";

// ダッシュボードに表示する集計値を取得する業務ロジック。
// API ルート（/api/dashboard）とサーバーコンポーネント（dashboard/page）の
// 両方から呼び、集計条件を1か所に揃える。

export type DashboardStats = {
  unreadCount: number;
  doneCount: number;
  // クイズ画面の出題対象（直近 QUIZ_LOOKBACK_DAYS 日）のうち未回答の数
  unansweredQuizCount: number;
  // 一度でも回答したクイズの数（復習での再回答は数えない）
  answeredQuizCount: number;
  // 各クイズの初回回答の正答率（0〜100 の整数%）。回答なしは null（0% と区別するため）
  accuracy: number | null;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [unreadCount, doneCount, unansweredQuizCount, firstAnswers] = await Promise.all([
    prisma.article.count({ where: { userId, status: "unread" } }),
    prisma.article.count({ where: { userId, status: "done" } }),
    prisma.quiz.count({ where: unansweredQuizWhere(userId) }),
    // 復習モードの再回答で正答率が上がらないよう、クイズごとに最初の回答だけを取る。
    // distinct は orderBy 順で最初に現れた行を残すため、answeredAt 昇順で初回回答になる。
    prisma.quizAnswer.findMany({
      where: { userId },
      distinct: ["quizId"],
      orderBy: { answeredAt: "asc" },
      select: { isCorrect: true },
    }),
  ]);

  const answeredQuizCount = firstAnswers.length;
  const correctCount = firstAnswers.filter((a) => a.isCorrect).length;
  const accuracy =
    answeredQuizCount > 0 ? Math.round((correctCount / answeredQuizCount) * 100) : null;

  return { unreadCount, doneCount, unansweredQuizCount, answeredQuizCount, accuracy };
}
