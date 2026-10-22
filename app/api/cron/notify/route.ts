import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth";
import { notifyUsersWithNewQuizzes } from "@/lib/services/notify";

// 定期実行(Cron)で、新しいクイズが生成されたユーザーへ通知メールを送る API。
// generate-quizzes の後に呼ばれる想定。認証だけをここで行い、
// 送信ロジックは notify サービスに委譲する。
// Vercel Cron は GET で呼ぶため GET を正とし、手動実行用に POST も同じ処理で受ける。
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await notifyUsersWithNewQuizzes();
  return NextResponse.json(results);
}

export const POST = GET;
