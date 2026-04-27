import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  const [unreadCount, doneCount] = await Promise.all([
    prisma.article.count({ where: { userId: session!.user!.id, status: "unread" } }),
    prisma.article.count({ where: { userId: session!.user!.id, status: "done" } }),
  ]);

  return <DashboardClient unreadCount={unreadCount} doneCount={doneCount} />;
}
