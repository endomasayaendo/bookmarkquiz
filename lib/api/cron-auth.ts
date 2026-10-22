import { createHash, timingSafeEqual } from "crypto";

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
// 長さ違いで早期 return すると長さが漏れるため、SHA-256 で固定長にしてから比較する。
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}
