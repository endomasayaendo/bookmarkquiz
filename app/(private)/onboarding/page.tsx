import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OnboardingClient from "./OnboardingClient";

function buildBookmarklet(template: string, appUrl: string, token: string): string {
  const js = template
    .replace(/__APP_URL__/g, appUrl)
    .replace(/__TOKEN__/g, token)
    .replace(/\s+/g, " ")
    .trim();
  return `javascript:${encodeURIComponent(js)}`;
}

export default async function OnboardingPage() {
  const session = await auth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: { bookmarkletToken: true },
  });

  // セッション（JWT）は有効でも、対象ユーザーがDBに存在しないことがある
  // （DB入れ替え・ユーザー削除後など）。存在しない行を update すると 500 になるため、
  // ログインし直しへ誘導する。/login はログイン済みでも素通しなのでループしない。
  if (!user) redirect("/login");

  let token = user.bookmarkletToken;
  if (!token) {
    token = crypto.randomUUID();
    await prisma.user.update({
      where: { id: session!.user!.id },
      data: { bookmarkletToken: token },
    });
  }

  const bookmarkletDir = path.join(process.cwd(), "public", "bookmarklets");
  const laterTemplate = fs.readFileSync(path.join(bookmarkletDir, "later.js"), "utf-8");
  const doneTemplate = fs.readFileSync(path.join(bookmarkletDir, "done.js"), "utf-8");

  const laterHref = buildBookmarklet(laterTemplate, appUrl, token);
  const doneHref = buildBookmarklet(doneTemplate, appUrl, token);

  return <OnboardingClient laterHref={laterHref} doneHref={doneHref} />;
}
