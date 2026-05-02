import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("Authorization");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
