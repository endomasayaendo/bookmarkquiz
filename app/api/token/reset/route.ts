import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ブックマークレット用トークンを再発行する API。
// 漏洩・不調時の作り直し用。古いトークンを上書きするため、既存の
// ブックマークレットは無効になり、オンボーディングで再登録が必要になる。
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newToken = crypto.randomUUID();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { bookmarkletToken: newToken },
  });

  return NextResponse.json({ ok: true });
}
