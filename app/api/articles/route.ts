import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import { isAllowedArticleUrl } from "@/lib/articles/url-rules";
import { withSession, withUserOrBookmarklet } from "@/lib/api/auth";

// 記事の保存（POST=「あとで読む」登録）と一覧取得（GET）を担う API。
// POST はブックマークレットからも叩かれるため CORS とトークン認証に対応する。

export function OPTIONS() {
  return corsPreflightResponse();
}

// 記事を未読として登録する。Web セッションと、ブックマークレットの
// Bearer トークンの両方を認証手段として受け付ける。
// 同一ユーザー×同一 URL は upsert で重複登録を防ぐ。
export const POST = withUserOrBookmarklet(async (userId, req) => {
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

  const article = await prisma.article.upsert({
    where: { userId_url: { userId, url } },
    update: { title, ogpImage: ogpImage ?? null },
    create: { userId, url, title, ogpImage: ogpImage ?? null },
  });

  return NextResponse.json(article, { status: 201, headers: CORS_HEADERS });
});

// ログインユーザーの記事一覧を返す。?status=unread|done で絞り込み可能。
export const GET = withSession(async (userId, req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "unread" | "done" | null;

  const articles = await prisma.article.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(articles);
});
