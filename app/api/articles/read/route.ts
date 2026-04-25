import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const bodyText = await fetchBodyText(url);

  const article = await prisma.article.upsert({
    where: {
      userId_url: { userId: session.user.id, url },
    },
    update: {
      status: "done",
      readAt: new Date(),
      bodyText,
    },
    create: {
      userId: session.user.id,
      url,
      title,
      ogpImage: ogpImage ?? null,
      bodyText,
      status: "done",
      readAt: new Date(),
    },
  });

  return NextResponse.json(article);
}
