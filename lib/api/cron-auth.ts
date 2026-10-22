import { timingSafeEqual } from "crypto";

// Vercel Cron からのリクエストを認証する共通処理。
// Authorization ヘッダに `Bearer <secret>` で来ても生の secret で来ても受理し、
// CRON_SECRET と比較する（Vercel Cron は Bearer 形式で送る）。
// CRON_SECRET 未設定時は常に false（誤って全許可しないため）。
export function isAuthorizedCronRequest(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authHeader = req.headers.get("Authorization") ?? "";
  const secret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  return safeEqual(secret, expected);
}

// タイミング攻撃でシークレットを推測されないよう定数時間で比較する。
// timingSafeEqual は長さ違いで例外を投げるため、先に長さで弾く。
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
