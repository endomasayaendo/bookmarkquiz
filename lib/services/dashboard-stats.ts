import { prisma } from "@/lib/prisma";

// ダッシュボードに表示する集計値を取得する業務ロジック。
// API ルート（/api/dashboard）とサーバーコンポーネント（dashboard/page）の
// 両方から呼び、集計条件を1か所に揃える。

export type DashboardStats = {
  unreadCount: number;
  doneCount: number;
  // 一度も回答していないクイズの数（次に解くべき問題数）
  unansweredQuizCount: number;
  // 回答の延べ回数（同じクイズへの再回答も1回として数える）
  answerCount: number;
  // 正答率（0〜100 の整数%）。未回答なら null（0% と区別するため）
  accuracy: number | null;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [unreadCount, doneCount, unansweredQuizCount, answerCount, correctCount] =
    await Promise.all([
      prisma.article.count({ where: { userId, status: "unread" } }),
      prisma.article.count({ where: { userId, status: "done" } }),
      prisma.quiz.count({
        where: { article: { userId }, quizAnswers: { none: { userId } } },
      }),
      prisma.quizAnswer.count({ where: { userId } }),
      prisma.quizAnswer.count({ where: { userId, isCorrect: true } }),
    ]);

  const accuracy = answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : null;

  return { unreadCount, doneCount, unansweredQuizCount, answerCount, accuracy };
}
