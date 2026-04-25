import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [unreadCount, doneCount] = await Promise.all([
    prisma.article.count({ where: { userId: session.user.id, status: "unread" } }),
    prisma.article.count({ where: { userId: session.user.id, status: "done" } }),
  ]);

  return NextResponse.json({ unreadCount, doneCount });
}
