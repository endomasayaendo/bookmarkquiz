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
        subject: "今日のクイズができました",
        html: `
          <p>今日読んだ記事からクイズが生成されました。</p>
          <p><a href="${appUrl}/quiz">クイズに挑戦する →</a></p>
        `,
      });
      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
