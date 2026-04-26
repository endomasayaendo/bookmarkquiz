import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBookmarkletUserId } from "@/lib/bookmarklet-auth";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import * as cheerio from "cheerio";

const ALLOWED_DOMAINS = ["qiita.com", "zenn.dev"];

function isAllowedDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

async function fetchBodyText(url: string): Promise<string> {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, aside").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);
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
