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
    vi.restoreAllMocks();
  });

  it("fetches article body text and upserts a done article", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    upsertMock.mockResolvedValue({ id: "article-1", status: "done", bodyText: "Read article body" });
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
    // 本文そのものはレスポンスに含めない
    expect(await res.json()).toEqual({ id: "article-1", status: "done", hasBodyText: true });
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

  it("still marks the article as done when fetching the body fails", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    upsertMock.mockResolvedValue({ id: "article-1", status: "done", bodyText: null });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 301 })));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await POST(request({
      url: "https://qiita.com/user/items/abc",
      title: "Article",
    }));

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await res.json()).toEqual({ id: "article-1", status: "done", hasBodyText: false });
    expect(warnSpy).toHaveBeenCalled();
    expect(upsertMock).toHaveBeenCalledWith({
      where: { userId_url: { userId: "user-1", url: "https://qiita.com/user/items/abc" } },
      // 既存の bodyText を null で上書きしない
      update: { status: "done", readAt: expect.any(Date) },
      create: expect.objectContaining({ bodyText: null, status: "done" }),
    });
  });

  it("reports hasBodyText from the stored article when a refetch fails", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    upsertMock.mockResolvedValue({ id: "article-1", bodyText: "Previously fetched" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await POST(request({
      url: "https://qiita.com/user/items/abc",
      title: "Article",
    }));

    expect(res.status).toBe(200);
    expect((await res.json()).hasBodyText).toBe(true);
  });

  it("treats an empty extracted body as a fetch failure", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    upsertMock.mockResolvedValue({ id: "article-1", status: "done", bodyText: null });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<body><script>app()</script></body>", {
        headers: { "content-type": "text/html" },
      }))
    );

    const res = await POST(request({
      url: "https://qiita.com/user/items/abc",
      title: "Article",
    }));

    expect((await res.json()).hasBodyText).toBe(false);
    // 既存の本文を空文字で上書きしない
    expect(upsertMock.mock.calls[0][0].update).toEqual({ status: "done", readAt: expect.any(Date) });
    expect(upsertMock.mock.calls[0][0].create.bodyText).toBeNull();
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
