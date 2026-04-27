"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuizItem } from "./page";

type Result = {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
};

type Props = {
  quizzes: QuizItem[];
};

export default function QuizClient({ quizzes }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  if (quizzes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="mb-2 text-gray-900 font-medium">クイズがまだありません</p>
          <p className="mb-6 text-sm text-gray-500">
            記事を「読んだ」に登録するとクイズが毎晩自動生成されます
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
            {score} / {quizzes.length}
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

  const quiz = quizzes[index];

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

  function handleNext() {
    if (index + 1 >= quizzes.length) {
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
          <span>
            {index + 1} / {quizzes.length}
          </span>
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
              {index + 1 >= quizzes.length ? "結果を見る" : "次の問題"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
