import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth";
import { generateQuizzesForRecentArticles } from "@/lib/services/quiz-generation";

// 定期実行(Cron)で、直近に既読化された記事から LLM で4択クイズを生成する API。
// 認証だけをここで行い、生成ロジックは quiz-generation サービスに委譲する。
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await generateQuizzesForRecentArticles();
  return NextResponse.json(results);
}
