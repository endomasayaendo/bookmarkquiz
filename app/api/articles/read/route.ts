import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBookmarkletUserId } from "@/lib/bookmarklet-auth";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import { fetchBodyText, isAllowedArticleUrl } from "@/lib/article-content";

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

  if (!isAllowedArticleUrl(url)) {
    return NextResponse.json(
      { error: "Qiita / Zenn の記事ページで実行してください" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const bodyText = await fetchBodyText(url);

  const article = await prisma.article.upsert({
    where: { userId_url: { userId, url } },
    update: { status: "done", readAt: new Date(), bodyText },
    create: {
      userId,
      url,
      title,
      ogpImage: ogpImage ?? null,
      bodyText,
      status: "done",
      readAt: new Date(),
    },
  });

  return NextResponse.json(article, { headers: CORS_HEADERS });
}
