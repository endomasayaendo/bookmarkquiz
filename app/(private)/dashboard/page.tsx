import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/services/dashboard-stats";
import DashboardClient from "./DashboardClient";

// ダッシュボードのサーバーコンポーネント。記事件数・クイズの回答状況と
// オンボーディング完了状態を取得してクライアントへ渡す。
export default async function DashboardPage() {
  const session = await auth();

  const userId = session!.user!.id!;
  const [stats, user] = await Promise.all([
    getDashboardStats(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompleted: true } }),
  ]);

  return (
    <DashboardClient
      stats={stats}
      onboardingCompleted={user?.onboardingCompleted ?? false}
    />
  );
}
