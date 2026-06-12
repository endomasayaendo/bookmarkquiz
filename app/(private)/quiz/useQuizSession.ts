"use client";

import { useReducer } from "react";
import type { QuizItem } from "./config";
import { submitQuizAnswer, type Result } from "./api";
import {
  quizSessionReducer,
  initialQuizSessionState,
  type QuizSessionState,
} from "./session-reducer";

// 出題セッションの状態機械(session-reducer)を useReducer で包む薄いフック。
// 採点処理 submit は引数で差し替え可能（既定は実 API）。
export function useQuizSession(
  quizzes: QuizItem[],
  submit: (quizId: string, selectedIndex: number) => Promise<Result> = submitQuizAnswer
): QuizSessionState & {
  handleSelect: (choiceIndex: number) => Promise<void>;
  handleNext: () => void;
} {
  const [state, dispatch] = useReducer(quizSessionReducer, initialQuizSessionState);

  // 選択肢を選んだら採点 API を呼ぶ。二重回答・連打はここで先にガードする。
  async function handleSelect(choiceIndex: number) {
    if (state.selected !== null || state.loading) return;
    dispatch({ type: "selectStart", choiceIndex });
    const result = await submit(quizzes[state.index].id, choiceIndex);
    dispatch({ type: "selectResult", result });
  }

  // 次の問題へ（最後なら結果画面へ遷移）。
  function handleNext() {
    dispatch({ type: "next", total: quizzes.length });
  }

  return { ...state, handleSelect, handleNext };
}
