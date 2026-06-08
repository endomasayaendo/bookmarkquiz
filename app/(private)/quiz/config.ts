// クイズ出題範囲の調整値。サーバー(page.tsx)と表示(QuizClient)で
// 同じ値を使うため一箇所に集約している。
export const QUIZ_LOOKBACK_DAYS = 7; // 何日前までのクイズを対象にするか
export const QUIZ_LIMIT = 10; // 一度に出題する最大問題数
