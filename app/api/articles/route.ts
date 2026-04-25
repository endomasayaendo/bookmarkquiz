import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_DOMAINS = ["qiita.com", "zenn.dev"];

function isAllowedDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, title, ogpImage } = await req.json();
  if (!url || !title) {
    return NextResponse.json({ error: "url and title are required" }, { status: 400 });
  }

  if (!isAllowedDomain(url)) {
    return NextResponse.json({ error: "このサイトは対応していません" }, { status: 400 });
  }

  const article = await prisma.article.create({
    data: {
      userId: session.user.id,
      url,
      title,
      ogpImage: ogpImage ?? null,
    },
  });

  return NextResponse.json(article, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "unread" | "done" | null;

  const articles = await prisma.article.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(articles);
}
