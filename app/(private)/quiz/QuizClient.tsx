"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuizItem } from "./page";
import { QUIZ_LOOKBACK_DAYS, QUIZ_LIMIT } from "./config";

type Result = {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
};

type Props = {
  quizzes: QuizItem[];
  allQuizzes: QuizItem[];
  allAnswered: boolean;
};

// クイズ出題のクライアントコンポーネント。
// 未回答クイズを1問ずつ出題し、選択肢のクリックで採点 API を呼んで
// 正誤・解説を表示する。全問終了後は復習モード（直近の全問再挑戦）へ切替可能。
export default function QuizClient({ quizzes, allQuizzes, allAnswered }: Props) {
  const [retry, setRetry] = useState(false); // 復習モードか
  const [index, setIndex] = useState(0); // 現在の問題番号
  const [selected, setSelected] = useState<number | null>(null); // 選んだ選択肢
  const [result, setResult] = useState<Result | null>(null); // 採点結果
  const [score, setScore] = useState(0); // 正解数
  const [finished, setFinished] = useState(false); // 全問終了したか
  const [loading, setLoading] = useState(false); // 採点 API 通信中

  if (allAnswered && !retry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
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
        </div>
      </div>
    );
  }

  // 通常は未回答クイズ、復習モードなら直近の全クイズを出題対象にする。
  const activeQuizzes = retry ? allQuizzes : quizzes;

  if (activeQuizzes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
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
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
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
        </div>
      </div>
    );
  }

  const quiz = activeQuizzes[index];

  // 選択肢を選んだら採点 API を呼ぶ。二重回答・連打は冒頭でガードする。
  async function handleSelect(choiceIndex: number) {
    if (selected !== null || loading) return;
    setSelected(choiceIndex);
    setLoading(true);

    const res = await fetch(`/api/quizzes/${quiz.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIndex: choiceIndex }),
    });
    const data: Result = await res.json();
    setResult(data);
    if (data.isCorrect) setScore((s) => s + 1);
    setLoading(false);
  }

  // 次の問題へ。最後ならば結果画面へ、それ以外は選択状態をリセットして進む。
  function handleNext() {
    if (index + 1 >= activeQuizzes.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setResult(null);
    }
  }

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
            {(quiz.choices as string[]).map((choice, i) => {
              let style = "border border-gray-200 bg-white text-gray-800 hover:border-gray-400";
              if (selected !== null && result) {
                if (i === result.correctIndex) {
                  style = "border border-green-500 bg-green-50 text-green-800";
                } else if (i === selected && !result.isCorrect) {
                  style = "border border-red-400 bg-red-50 text-red-800";
                } else {
                  style = "border border-gray-200 bg-white text-gray-400";
                }
              }

              return (
                <li key={i}>
                  <button
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null || loading}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${style}`}
                  >
                    {choice}
                  </button>
                </li>
              );
            })}
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
