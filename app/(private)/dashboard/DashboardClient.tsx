"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  unreadCount: number;
  doneCount: number;
};

export default function DashboardClient({ unreadCount, doneCount }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("onboarding_completed")) {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">ダッシュボード</h1>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <Link
            href="/articles?status=unread"
            className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-400"
          >
            <p className="text-sm text-blue-500">未読</p>
            <p className="text-4xl font-bold text-blue-800">{unreadCount}</p>
            <p className="text-sm text-blue-300">本</p>
          </Link>

          <Link
            href="/articles?status=done"
            className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-400"
          >
            <p className="text-sm text-green-500">読んだ</p>
            <p className="text-4xl font-bold text-green-800">{doneCount}</p>
            <p className="text-sm text-green-300">本</p>
          </Link>
        </div>

        <Link
          href="/quiz"
          className="mb-4 block w-full rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-gray-700"
        >
          クイズへ進む
        </Link>

        <Link
          href="/onboarding"
          className="block text-center text-sm text-gray-400 hover:text-gray-600"
        >
          ブックマークレットを再設定する
        </Link>
      </div>
    </div>
  );
}
