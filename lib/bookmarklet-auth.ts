import { prisma } from "@/lib/prisma";

// ブックマークレットからのリクエストを認証する。Cookie セッションを持てない
// クロスオリジン実行のため、`Authorization: Bearer <token>` に埋め込まれた
// ユーザー固有トークン（User.bookmarkletToken）で本人を特定する。
// 一致するユーザーがいなければ null を返す（=未認証）。
export async function getBookmarkletUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { bookmarkletToken: token },
    select: { id: true },
  });
  return user?.id ?? null;
}
