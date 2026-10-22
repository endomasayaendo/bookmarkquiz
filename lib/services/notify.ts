import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// 新しいクイズが生成されたユーザーへ通知メールを送る業務ロジック。
// cron ルートからこの関数を呼ぶだけにし、認証・HTTP の関心とは分離する。
// メール送信クライアントは引数で差し替え可能（テスト時に fake を注入）。

export type NotifyResult = { sent: number; errors: number };

// Resend のうち本サービスが必要とする最小インターフェースだけを型にする。
// Resend の send は API エラー（未認証ドメイン・レート制限など）でも例外を投げず
// `{ error }` を返すため、戻り値の error も失敗として扱えるよう型に含める。
export type EmailSender = {
  emails: {
    send: (params: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<{ error?: unknown }>;
  };
};

// 未通知クイズの探索範囲。Cron が数回失敗・重複しても取りこぼさない幅を持たせつつ、
// notifiedAt 導入前の古いクイズでまとめて通知が飛ばないよう上限を設ける。
const LOOKBACK_MS = 48 * 60 * 60 * 1000;

export async function notifyUsersWithNewQuizzes(
  opts: { mailer?: EmailSender } = {}
): Promise<NotifyResult> {
  // Resend 未設定の環境（ローカル・メール通知を使わないデプロイ）では送信をスキップする。
  // cron が毎日失敗し続けないよう、エラーではなく 0 件として返す。
  if (!opts.mailer && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM)) {
    console.warn("[notify] RESEND_API_KEY / RESEND_FROM が未設定のため送信をスキップします");
    return { sent: 0, errors: 0 };
  }

  // mailer 未指定時のみ実クライアントを生成（テスト時は env 不要にするため遅延生成）。
  const mailer = opts.mailer ?? new Resend(process.env.RESEND_API_KEY);

  // まだ通知していない（notifiedAt が null の）クイズを持つ記事のオーナー（メールあり）を抽出。
  // 通知済みを記録するので、Cron の再実行・手動実行・生成との時間帯の重なりがあっても二重送信しない。
  const since = new Date(Date.now() - LOOKBACK_MS);
  const pendingQuiz = { notifiedAt: null, createdAt: { gte: since } };

  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      articles: { some: { quizzes: { some: pendingQuiz } } },
    },
    select: { id: true, email: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const results: NotifyResult = { sent: 0, errors: 0 };

  // ユーザーごとに送信。1人分の送信失敗が全体を止めないよう個別に集計する。
  for (const user of users) {
    const quizzes = await prisma.quiz.findMany({
      where: { ...pendingQuiz, article: { userId: user.id } },
      select: { id: true },
    });
    const quizIds = quizzes.map((q) => q.id);
    const notifiedAt = new Date();

    // 送信前に「通知済み」を確保する。同時に走った別の実行が先に確保していれば 0 件になり送らない。
    const claimed = await prisma.quiz.updateMany({
      where: { id: { in: quizIds }, notifiedAt: null },
      data: { notifiedAt },
    });
    if (claimed.count === 0) continue;

    try {
      const { error } = await mailer.emails.send({
        from: process.env.RESEND_FROM!,
        to: user.email!,
        subject: "【BookmarkQuiz】新しいクイズができました",
        html: `
          <h2 style="color:#111">BookmarkQuiz</h2>
          <p>読んだ記事から新しいクイズができました。さっそく挑戦してみましょう。</p>
          <p>
            <a href="${appUrl}/quiz" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
              クイズに挑戦する →
            </a>
          </p>
          <hr style="margin-top:32px;border:none;border-top:1px solid #eee" />
          <p style="font-size:12px;color:#999">このメールはBookmarkQuizから自動送信されています。</p>
        `,
      });
      if (error) throw error;
      results.sent++;
    } catch {
      // 送れなかった分は次回の実行で再送できるよう、今回確保した記録だけを戻す。
      await prisma.quiz.updateMany({
        where: { id: { in: quizIds }, notifiedAt },
        data: { notifiedAt: null },
      });
      results.errors++;
    }
  }

  return results;
}
