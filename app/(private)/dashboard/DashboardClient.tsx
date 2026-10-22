"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { DashboardStats } from "@/lib/services/dashboard-stats";

type Props = {
  stats: DashboardStats;
  onboardingCompleted: boolean;
};

// ダッシュボードの表示と遷移を担うクライアントコンポーネント。
// 未読／既読の件数とクイズの回答状況の表示、クイズ・記事一覧への導線、サインアウトを提供する。
export default function DashboardClient({ stats, onboardingCompleted }: Props) {
  const { unreadCount, doneCount, unansweredQuizCount, answerCount, accuracy } = stats;
  const router = useRouter();

  // オンボーディング未完了ならダッシュボードを見せず設定画面へ誘導する。
  useEffect(() => {
    if (!onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [onboardingCompleted, router]);

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

        <section
          aria-label="クイズの回答状況"
          className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-white p-4 text-center shadow-sm"
        >
          <div>
            <p className="text-xs text-gray-500">未回答</p>
            <p className="text-2xl font-bold text-gray-900">{unansweredQuizCount}</p>
            <p className="text-xs text-gray-400">問</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">回答数</p>
            <p className="text-2xl font-bold text-gray-900">{answerCount}</p>
            <p className="text-xs text-gray-400">回</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">正答率</p>
            <p className="text-2xl font-bold text-gray-900">{accuracy ?? "—"}</p>
            <p className="text-xs text-gray-400">{accuracy === null ? "未回答" : "%"}</p>
          </div>
        </section>

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

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 block w-full text-center text-sm text-gray-400 hover:text-gray-600"
        >
          サインアウト
        </button>
      </div>
    </div>
  );
}
