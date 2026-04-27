import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
