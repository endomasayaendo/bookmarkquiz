import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { DELETE, PATCH } from "@/app/api/articles/[id]/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const authMock = auth as unknown as Mock;
const findFirstMock = prisma.article.findFirst as unknown as Mock;
const deleteMock = prisma.article.delete as unknown as Mock;
const updateMock = prisma.article.update as unknown as Mock;

const req = new Request("https://example.com/api/articles/article-1") as never;
const params = { params: Promise.resolve({ id: "article-1" }) };

describe("/api/articles/[id]", () => {
  beforeEach(() => {
    authMock.mockReset();
    findFirstMock.mockReset();
    deleteMock.mockReset();
    updateMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes an article owned by the current user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ id: "article-1" });
    deleteMock.mockResolvedValue({});

    const res = await DELETE(req, params);

    expect(res.status).toBe(204);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "article-1" } });
  });

  it("returns 404 when deleting an article not owned by the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue(null);

    const res = await DELETE(req, params);

    expect(res.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("marks an unread article as done and stores fetched body text", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({
      id: "article-1",
      status: "unread",
      url: "https://qiita.com/user/items/abc",
      bodyText: null,
    });
    updateMock.mockResolvedValue({ id: "article-1", status: "done" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<body><article>Readable body</article></body>", {
        headers: { "content-type": "text/html" },
      }))
    );

    const res = await PATCH(req, params);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "article-1", status: "done" });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "article-1" },
      data: expect.objectContaining({
        status: "done",
        bodyText: "Readable body",
      }),
    });
  });

  it("does not mark an article as done when body fetch fails", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({
      id: "article-1",
      status: "unread",
      url: "https://qiita.com/user/items/abc",
      bodyText: null,
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 404 })));

    const res = await PATCH(req, params);

    expect(res.status).toBe(502);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("marks a done article as unread and clears readAt", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({
      id: "article-1",
      status: "done",
      url: "https://qiita.com/user/items/abc",
      bodyText: "Already fetched",
    });
    updateMock.mockResolvedValue({ id: "article-1", status: "unread" });

    const res = await PATCH(req, params);

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "article-1" },
      data: {
        status: "unread",
        readAt: null,
      },
    });
  });
});
