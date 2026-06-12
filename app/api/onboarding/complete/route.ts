import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSession } from "@/lib/api/auth";

// オンボーディング完了を記録する API。以降ダッシュボードは
// /onboarding へリダイレクトしなくなる。
export const POST = withSession(async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({ ok: true });
});
