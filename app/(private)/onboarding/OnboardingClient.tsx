"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  laterHref: string;
  doneHref: string;
};

export default function OnboardingClient({ laterHref, doneHref }: Props) {
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | null>(1);
  const router = useRouter();
  const laterRef = useRef<HTMLAnchorElement>(null);
  const doneRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    laterRef.current?.setAttribute("href", laterHref);
    doneRef.current?.setAttribute("href", doneHref);
  }, [laterHref, doneHref]);

  useEffect(() => {
    if (!tutorialStep) return;
    const t = setTimeout(() => {
      setTutorialStep((s) => (s === 1 ? 2 : null));
    }, 3000);
    return () => clearTimeout(t);
  }, [tutorialStep]);

  function handleDragStart(step: 1 | 2) {
    setTutorialStep((s) => (s === step ? (step === 1 ? 2 : null) : s));
  }

  function handleBookmarkletClick(e: React.MouseEvent) {
    e.preventDefault();
    alert("ドラッグしてブックマークバーに追加してください");
  }

  function handleStart() {
    localStorage.setItem("onboarding_completed", "1");
    router.push("/dashboard");
  }

  function handleReset() {
    if (!confirm("トークンをリセットすると、古いブックマークレットは使えなくなります。続けますか？")) return;
    startTransition(async () => {
      await fetch("/api/token/reset", { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">はじめる前に</h1>
        <p className="mb-4 text-center text-sm text-gray-700">
          以下のボタンをブックマークバーにドラッグして追加してください
        </p>

        {/* ステップインジケーター */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${tutorialStep === 1 ? "bg-blue-500" : "bg-gray-300"}`} />
          <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${tutorialStep === 2 ? "bg-green-500" : "bg-gray-300"}`} />
          {tutorialStep && (
            <button
              onClick={() => setTutorialStep(null)}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600"
            >
              スキップ
            </button>
          )}
        </div>

        {/* チュートリアルヒント */}
        <div className="mb-2 flex gap-4">
          <div className="flex flex-1 flex-col items-center gap-1">
            {tutorialStep === 1 && (
              <div className="flex flex-col items-center animate-bounce">
                <span className="text-xl text-blue-500">↑</span>
                <span className="text-xs text-blue-500 whitespace-nowrap">ブックマークバーへ</span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            {tutorialStep === 2 && (
              <div className="flex flex-col items-center animate-bounce">
                <span className="text-xl text-green-500">↑</span>
                <span className="text-xs text-green-500 whitespace-nowrap">ブックマークバーへ</span>
              </div>
            )}
          </div>
        </div>

        {/* ブックマークレットボタン */}
        <div className="mb-8 flex gap-4">
          <a
            ref={laterRef}
            onClick={handleBookmarkletClick}
            onDragStart={() => handleDragStart(1)}
            className={`flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-500 cursor-grab transition-all duration-300 ${
              tutorialStep === 1 ? "ring-4 ring-blue-300 ring-offset-2 scale-105" : ""
            }`}
          >
            あとで読む
          </a>
          <a
            ref={doneRef}
            onClick={handleBookmarkletClick}
            onDragStart={() => handleDragStart(2)}
            className={`flex-1 rounded-lg bg-green-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-green-500 cursor-grab transition-all duration-300 ${
              tutorialStep === 2 ? "ring-4 ring-green-300 ring-offset-2 scale-105" : ""
            }`}
          >
            読んだ
          </a>
        </div>

        <label className="mb-6 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-800">2つのボタンをブックマークバーに追加しました</span>
        </label>

        <button
          onClick={handleStart}
          disabled={!checked}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-40 hover:bg-gray-700 disabled:cursor-not-allowed"
        >
          はじめる
        </button>

        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs text-gray-500">動かなくなった場合はリセットして再登録できます</p>
          <button
            onClick={handleReset}
            disabled={isPending}
            className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-500 hover:border-red-500 hover:text-red-700 disabled:opacity-40"
          >
            {isPending ? "リセット中..." : "トークンをリセットする"}
          </button>
        </div>
      </div>
    </div>
  );
}
