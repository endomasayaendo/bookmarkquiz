import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// 新しいクイズが生成されたユーザーへ通知メールを送る業務ロジック。
// cron ルートからこの関数を呼ぶだけにし、認証・HTTP の関心とは分離する。
// メール送信クライアントは引数で差し替え可能（テスト時に fake を注入）。

export type NotifyResult = { sent: number; errors: number };

// Resend のうち本サービスが必要とする最小インターフェースだけを型にする。
export type EmailSender = {
  emails: {
    send: (params: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<unknown>;
  };
};

export async function notifyUsersWithNewQuizzes(
  opts: { mailer?: EmailSender } = {}
): Promise<NotifyResult> {
  // mailer 未指定時のみ実クライアントを生成（テスト時は env 不要にするため遅延生成）。
  const mailer = opts.mailer ?? new Resend(process.env.RESEND_API_KEY);

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
  const results: NotifyResult = { sent: 0, errors: 0 };

  // ユーザーごとに送信。1人分の送信失敗が全体を止めないよう個別に集計する。
  for (const user of users) {
    try {
      await mailer.emails.send({
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

  return results;
}
