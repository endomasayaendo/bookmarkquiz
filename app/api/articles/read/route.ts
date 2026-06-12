import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import { isAllowedArticleUrl } from "@/lib/articles/url-rules";
import { fetchBodyText } from "@/lib/articles/fetch-body";
import { withUserOrBookmarklet } from "@/lib/api/auth";

// 記事を「読んだ」として登録する API（ブックマークレットの「読んだ」ボタン用）。
// /api/articles との違いは、本文を実際に取得してクイズ生成の元データを保存する点。

export function OPTIONS() {
  return corsPreflightResponse();
}

// 記事を既読(done)で登録／更新する。登録時に本文テキストを取得して保存し、
// 後続の Cron（generate-quizzes）がこの bodyText からクイズを生成する。
// 未登録なら create、既存なら done へ更新する upsert。
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
});
