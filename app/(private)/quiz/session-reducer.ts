import type { Result } from "./api";

// クイズ出題セッションの状態遷移を、React に依存しない純粋な reducer として定義する。
// これにより出題進行・スコア集計・二重回答ガードを単体テストできる。

export type QuizSessionState = {
  index: number; // 現在の問題番号
  selected: number | null; // 選んだ選択肢（未選択は null）
  result: Result | null; // 採点結果
  score: number; // 正解数
  finished: boolean; // 全問終了したか
  loading: boolean; // 採点 API 通信中
};

export const initialQuizSessionState: QuizSessionState = {
  index: 0,
  selected: null,
  result: null,
  score: 0,
  finished: false,
  loading: false,
};

export type QuizSessionAction =
  | { type: "selectStart"; choiceIndex: number }
  | { type: "selectResult"; result: Result }
  | { type: "next"; total: number };

export function quizSessionReducer(
  state: QuizSessionState,
  action: QuizSessionAction
): QuizSessionState {
  switch (action.type) {
    case "selectStart":
      // 二重回答・連打のガード。既に選択済み or 通信中なら無視する。
      if (state.selected !== null || state.loading) return state;
      return { ...state, selected: action.choiceIndex, loading: true };
    case "selectResult":
      // 採点結果を反映し、正解ならスコアを加算する。
      return {
        ...state,
        result: action.result,
        loading: false,
        score: action.result.isCorrect ? state.score + 1 : state.score,
      };
    case "next":
      // 最後の問題なら終了。そうでなければ次へ進み選択状態をリセット。
      if (state.index + 1 >= action.total) {
        return { ...state, finished: true };
      }
      return { ...state, index: state.index + 1, selected: null, result: null };
    default:
      return state;
  }
}
