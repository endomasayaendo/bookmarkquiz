import { callApi } from "@/lib/client/api";

// 採点 API の結果。正誤・正解インデックス・解説を含む。
export type Result = {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
};

// クイズ回答を採点 API に送り、結果を受け取る。
// 既存挙動どおりエラーハンドリングは行わない（呼び出し側の状態機械に委ねる）。
export async function submitQuizAnswer(quizId: string, selectedIndex: number): Promise<Result> {
  const { data } = await callApi<Result>(`/api/quizzes/${quizId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedIndex }),
  });
  return data as Result;
}
