"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  laterHref: string;
  doneHref: string;
};

export default function OnboardingClient({ laterHref, doneHref }: Props) {
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const laterRef = useRef<HTMLAnchorElement>(null);
  const doneRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    laterRef.current?.setAttribute("href", laterHref);
    doneRef.current?.setAttribute("href", doneHref);
  }, [laterHref, doneHref]);

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
        <p className="mb-6 text-center text-sm text-gray-700">
          以下のボタンをブックマークバーにドラッグして追加してください
        </p>

        <div className="mb-8 flex gap-4">
          <a
            ref={laterRef}
            onClick={handleBookmarkletClick}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-500 cursor-grab"
          >
            あとで読む
          </a>
          <a
            ref={doneRef}
            onClick={handleBookmarkletClick}
            className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-green-500 cursor-grab"
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
