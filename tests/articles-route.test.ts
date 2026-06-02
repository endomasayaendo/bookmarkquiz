import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { GET, POST } from "@/app/api/articles/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/bookmarklet-auth", () => ({ getBookmarkletUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

const authMock = auth as unknown as Mock;
const findManyMock = prisma.article.findMany as unknown as Mock;
const upsertMock = prisma.article.upsert as unknown as Mock;

function postRequest(body: unknown) {
  return new Request("https://example.com/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

describe("/api/articles", () => {
  beforeEach(() => {
    authMock.mockReset();
    findManyMock.mockReset();
    upsertMock.mockReset();
  });

  it("rejects unauthenticated POST requests", async () => {
    authMock.mockResolvedValue(null);

    const res = await POST(postRequest({ url: "https://qiita.com/u/items/a", title: "Article" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects unsupported article domains", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(postRequest({ url: "https://example.com/post", title: "Article" }));

    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("upserts an allowed article for the current user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    upsertMock.mockResolvedValue({ id: "article-1" });

    const res = await POST(postRequest({
      url: "https://zenn.dev/user/articles/abc",
      title: "Article",
      ogpImage: "https://example.com/ogp.png",
    }));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "article-1" });
    expect(upsertMock).toHaveBeenCalledWith({
      where: { userId_url: { userId: "user-1", url: "https://zenn.dev/user/articles/abc" } },
      update: { title: "Article", ogpImage: "https://example.com/ogp.png" },
      create: {
        userId: "user-1",
        url: "https://zenn.dev/user/articles/abc",
        title: "Article",
        ogpImage: "https://example.com/ogp.png",
      },
    });
  });

  it("lists articles for the current user and optional status", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findManyMock.mockResolvedValue([{ id: "article-1" }]);
    const req = new Request("https://example.com/api/articles?status=done") as never;

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "article-1" }]);
    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1", status: "done" },
      orderBy: { createdAt: "desc" },
    });
  });
});
