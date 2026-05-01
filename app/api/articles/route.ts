import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBookmarkletUserId } from "@/lib/bookmarklet-auth";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

const ALLOWED_DOMAINS = ["qiita.com", "zenn.dev"];

function isAllowedDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? (await getBookmarkletUserId(req));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const { url, title, ogpImage } = await req.json();
  if (!url || !title) {
    return NextResponse.json(
      { error: "url and title are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!isAllowedDomain(url)) {
    return NextResponse.json(
      { error: "このサイトは対応していません" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const article = await prisma.article.upsert({
    where: { userId_url: { userId, url } },
    update: { title, ogpImage: ogpImage ?? null },
    create: { userId, url, title, ogpImage: ogpImage ?? null },
  });

  return NextResponse.json(article, { status: 201, headers: CORS_HEADERS });
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
