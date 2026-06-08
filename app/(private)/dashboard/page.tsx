import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

// ダッシュボードのサーバーコンポーネント。記事の未読／既読件数と
// オンボーディング完了状態を取得してクライアントへ渡す。
export default async function DashboardPage() {
  const session = await auth();

  const userId = session!.user!.id;
  const [unreadCount, doneCount, user] = await Promise.all([
    prisma.article.count({ where: { userId, status: "unread" } }),
    prisma.article.count({ where: { userId, status: "done" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompleted: true } }),
  ]);

  return (
    <DashboardClient
      unreadCount={unreadCount}
      doneCount={doneCount}
      onboardingCompleted={user?.onboardingCompleted ?? false}
    />
  );
}
