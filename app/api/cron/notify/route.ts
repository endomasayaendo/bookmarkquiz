import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth";
import { notifyUsersWithNewQuizzes } from "@/lib/services/notify";

// 定期実行(Cron)で、新しいクイズが生成されたユーザーへ通知メールを送る API。
// generate-quizzes の後に呼ばれる想定。認証だけをここで行い、
// 送信ロジックは notify サービスに委譲する。
export async function POST(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await notifyUsersWithNewQuizzes();
  return NextResponse.json(results);
}
