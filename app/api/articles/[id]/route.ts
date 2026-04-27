import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAuthorizedArticle(id: string, userId: string) {
  return prisma.article.findFirst({ where: { id, userId } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await getAuthorizedArticle(id, session.user.id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });
  return new Response(null, { status: 204 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await getAuthorizedArticle(id, session.user.id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newStatus = article.status === "unread" ? "done" : "unread";
  const updated = await prisma.article.update({
    where: { id },
    data: {
      status: newStatus,
      readAt: newStatus === "done" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}
