import { NextResponse } from "next/server";
import { withSession } from "@/lib/api/auth";
import { getDashboardStats } from "@/lib/services/dashboard-stats";

// ダッシュボード表示用に、ログインユーザーの記事件数とクイズの回答状況を返す API。
export const GET = withSession(async (userId) => {
  return NextResponse.json(await getDashboardStats(userId));
});
