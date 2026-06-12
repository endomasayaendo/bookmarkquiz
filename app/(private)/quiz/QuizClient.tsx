"use client";

import { useState } from "react";
import Link from "next/link";
import CenteredCard from "@/components/CenteredCard";
import type { QuizItem } from "./config";
import { QUIZ_LOOKBACK_DAYS, QUIZ_LIMIT } from "./config";
import { useQuizSession } from "./useQuizSession";
import { choiceStyle } from "./choice-style";

type Props = {
  quizzes: QuizItem[];
  allQuizzes: QuizItem[];
  allAnswered: boolean;
};

// クイズ出題のクライアントコンポーネント。
// 出題セッションの状態は useQuizSession に委譲し、ここでは表示の分岐と
// 復習モード(retry)への切替だけを担う。
export default function QuizClient({ quizzes, allQuizzes, allAnswered }: Props) {
  const [retry, setRetry] = useState(false); // 復習モードか

  // 通常は未回答クイズ、復習モードなら直近の全クイズを出題対象にする。
  const activeQuizzes = retry ? allQuizzes : quizzes;
  const { index, selected, result, score, finished, loading, handleSelect, handleNext } =
    useQuizSession(activeQuizzes);

  if (allAnswered && !retry) {
    return (
      <CenteredCard>
        <p className="mb-2 text-gray-900 font-medium">未回答のクイズはありません</p>
        <p className="mb-1 text-sm text-gray-500">新しいクイズは毎日21:10ごろ生成されます</p>
        <p className="mb-6 text-sm text-gray-500">直近{QUIZ_LOOKBACK_DAYS}日以内のクイズを最大{QUIZ_LIMIT}問復習できます</p>
        <button
          onClick={() => setRetry(true)}
          className="mb-3 block w-full rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          直近のクイズを復習する
        </button>
        <Link href="/dashboard" className="block text-sm text-gray-400 hover:text-gray-600">
          ダッシュボードへ戻る
        </Link>
      </CenteredCard>
    );
  }

  if (activeQuizzes.length === 0) {
    return (
      <CenteredCard>
        <p className="mb-2 text-gray-900 font-medium">クイズがまだありません</p>
        <p className="mb-6 text-sm text-gray-500">
          記事を「読んだ」に登録すると毎日21:10ごろクイズが生成されます。直近{QUIZ_LOOKBACK_DAYS}日以内・最大{QUIZ_LIMIT}問が表示されます。
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          ダッシュボードへ
        </Link>
      </CenteredCard>
    );
  }

  if (finished) {
    return (
      <CenteredCard>
        <p className="mb-1 text-3xl font-bold text-gray-900">
          {score} / {activeQuizzes.length}
        </p>
        <p className="mb-6 text-sm text-gray-500">正解数</p>
        <Link
          href="/dashboard"
          className="block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-gray-700"
        >
          ダッシュボードへ
        </Link>
      </CenteredCard>
    );
  }

  const quiz = activeQuizzes[index];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-600">
            ← ダッシュボード
          </Link>
          <div className="text-right">
            <span>{index + 1} / {activeQuizzes.length}</span>
            <p className="text-xs text-gray-300">{retry ? `復習モード（直近${QUIZ_LOOKBACK_DAYS}日・最大${QUIZ_LIMIT}問）` : "未回答のクイズ"}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-1 text-xs text-gray-400">{quiz.article.title}</p>
          <p className="mb-6 text-base font-medium text-gray-900">{quiz.question}</p>

          <ul className="space-y-3">
            {(quiz.choices as string[]).map((choice, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null || loading}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${choiceStyle(i, selected, result)}`}
                >
                  {choice}
                </button>
              </li>
            ))}
          </ul>

          {result && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className={`mb-1 text-sm font-medium ${result.isCorrect ? "text-green-700" : "text-red-600"}`}>
                {result.isCorrect ? "正解！" : "不正解"}
              </p>
              <p className="text-sm text-gray-600">{result.explanation}</p>
            </div>
          )}

          {result && (
            <button
              onClick={handleNext}
              className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              {index + 1 >= activeQuizzes.length ? "結果を見る" : "次の問題"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
