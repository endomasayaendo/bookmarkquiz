import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { POST } from "@/app/api/articles/read/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/bookmarklet-auth", () => ({ getBookmarkletUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      upsert: vi.fn(),
    },
  },
}));

const authMock = auth as unknown as Mock;
const upsertMock = prisma.article.upsert as unknown as Mock;

function request(body: unknown) {
  return new Request("https://example.com/api/articles/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

describe("POST /api/articles/read", () => {
  beforeEach(() => {
    authMock.mockReset();
    upsertMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches article body text and upserts a done article", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    upsertMock.mockResolvedValue({ id: "article-1" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<body><main>Read article body</main></body>", {
        headers: { "content-type": "text/html" },
      }))
    );

    const res = await POST(request({
      url: "https://qiita.com/user/items/abc",
      title: "Article",
      ogpImage: null,
    }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "article-1" });
    expect(upsertMock).toHaveBeenCalledWith({
      where: { userId_url: { userId: "user-1", url: "https://qiita.com/user/items/abc" } },
      update: { status: "done", readAt: expect.any(Date), bodyText: "Read article body" },
      create: {
        userId: "user-1",
        url: "https://qiita.com/user/items/abc",
        title: "Article",
        ogpImage: null,
        bodyText: "Read article body",
        status: "done",
        readAt: expect.any(Date),
      },
    });
  });

  it("rejects unsupported article domains before fetching", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(request({ url: "https://example.com/post", title: "Article" }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
