import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth";

// 定期実行(Cron)で、新しいクイズが生成されたユーザーへ通知メールを送る API。
// generate-quizzes の後に呼ばれる想定。
export async function POST(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // 直近24時間に生成されたクイズを持つ記事のオーナー（メールあり）を抽出。
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      articles: {
        some: {
          quizzes: {
            some: { createdAt: { gte: since } },
          },
        },
      },
    },
    select: { email: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const results = { sent: 0, errors: 0 };

  // ユーザーごとに送信。1人分の送信失敗が全体を止めないよう個別に集計する。
  for (const user of users) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: user.email!,
        subject: "【BookmarkQuiz】今日のクイズができました",
        html: `
          <h2 style="color:#111">BookmarkQuiz</h2>
          <p>今日読んだ記事からクイズが生成されました。さっそく挑戦してみましょう。</p>
          <p>
            <a href="${appUrl}/quiz" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
              クイズに挑戦する →
            </a>
          </p>
          <hr style="margin-top:32px;border:none;border-top:1px solid #eee" />
          <p style="font-size:12px;color:#999">このメールはBookmarkQuizから自動送信されています。</p>
        `,
      });
      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
