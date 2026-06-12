import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSession } from "@/lib/api/auth";

// ブックマークレット用トークンを再発行する API。
// 漏洩・不調時の作り直し用。古いトークンを上書きするため、既存の
// ブックマークレットは無効になり、オンボーディングで再登録が必要になる。
export const POST = withSession(async (userId) => {
  const newToken = crypto.randomUUID();
  await prisma.user.update({
    where: { id: userId },
    data: { bookmarkletToken: newToken },
  });

  return NextResponse.json({ ok: true });
});
