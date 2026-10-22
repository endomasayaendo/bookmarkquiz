// クイズ出題範囲の調整値。サーバー(page.tsx)と表示(QuizClient)で
// 同じ値を使うため一箇所に集約している。
export const QUIZ_LOOKBACK_DAYS = 7; // 何日前までのクイズを対象にするか
export const QUIZ_LIMIT = 10; // 一度に出題する最大問題数

// 出題対象（直近 QUIZ_LOOKBACK_DAYS 日の本人のクイズ）の Prisma where 条件。
// クイズ画面とダッシュボードの「未回答数」で同じ範囲を数えるため共通化する。
export function recentQuizWhere(userId: string, now: Date = new Date()) {
  const since = new Date(now);
  since.setDate(since.getDate() - QUIZ_LOOKBACK_DAYS);
  return { article: { userId }, createdAt: { gte: since } };
}

// 出題対象のうち、本人がまだ一度も回答していないクイズの where 条件。
export function unansweredQuizWhere(userId: string, now: Date = new Date()) {
  return { ...recentQuizWhere(userId, now), quizAnswers: { none: { userId } } };
}

// 出題1問分の型。サーバー(page.tsx)が DB から組み立て、
// クライアント(QuizClient)が表示に使う共有の型。
// クライアントがサーバーページのモジュールに依存しないよう、ここに置く。
export type QuizItem = {
  id: string;
  question: string;
  choices: string[];
  type: string;
  article: { title: string };
};
