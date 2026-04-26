import { prisma } from "@/lib/prisma";

export async function getBookmarkletUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { bookmarkletToken: token },
    select: { id: true },
  });
  return user?.id ?? null;
}
