import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSession } from "@/lib/api/auth";

// ダッシュボード表示用に、ログインユーザーの未読／既読の記事件数を返す API。
export const GET = withSession(async (userId) => {
  const [unreadCount, doneCount] = await Promise.all([
    prisma.article.count({ where: { userId, status: "unread" } }),
    prisma.article.count({ where: { userId, status: "done" } }),
  ]);

  return NextResponse.json({ unreadCount, doneCount });
});
