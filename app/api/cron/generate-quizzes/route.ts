import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth";
import { generateQuizzesForPendingArticles } from "@/lib/services/quiz-generation";

// 定期実行(Cron)で、既読化されたがクイズ未生成の記事から LLM で4択クイズを生成する API。
// 認証だけをここで行い、生成ロジックは quiz-generation サービスに委譲する。

// LLM 呼び出しを直列に行うため、既定の実行時間上限より長めに確保する。
// 1回の処理件数と経過時間はサービス側で上限を設け、この時間内に結果を返す。
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await generateQuizzesForPendingArticles();
  return NextResponse.json(results);
}
