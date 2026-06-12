import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { NextResponse } from "next/server";
import { withSession, withUserOrBookmarklet, jsonError } from "@/lib/api/auth";
import { auth } from "@/auth";
import { getBookmarkletUserId } from "@/lib/bookmarklet-auth";
import { CORS_HEADERS } from "@/lib/cors";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/bookmarklet-auth", () => ({ getBookmarkletUserId: vi.fn() }));

const authMock = auth as unknown as Mock;
const bookmarkletMock = getBookmarkletUserId as unknown as Mock;

function req(headers?: Record<string, string>) {
  return new Request("https://example.com/api/test", { headers }) as never;
}

describe("jsonError", () => {
  it("returns a JSON error body with the given status", async () => {
    const res = jsonError("Nope", 403);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Nope" });
  });

  it("attaches headers when provided", () => {
    const res = jsonError("Nope", 401, CORS_HEADERS);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("withSession", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("returns 401 with { error: 'Unauthorized' } when not logged in", async () => {
    authMock.mockResolvedValue(null);
    const handler = vi.fn();
    const route = withSession(handler);

    const res = await route(req(), undefined);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes userId, req and ctx through to the handler when logged in", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const ctx = { params: Promise.resolve({ id: "x" }) };
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const route = withSession<typeof ctx>(handler);

    const request = req();
    const res = await route(request, ctx);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith("user-1", request, ctx);
  });
});

describe("withUserOrBookmarklet", () => {
  beforeEach(() => {
    authMock.mockReset();
    bookmarkletMock.mockReset();
  });

  it("returns 401 with CORS headers when neither session nor token resolves", async () => {
    authMock.mockResolvedValue(null);
    bookmarkletMock.mockResolvedValue(null);
    const handler = vi.fn();
    const route = withUserOrBookmarklet(handler);

    const res = await route(req());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(handler).not.toHaveBeenCalled();
  });

  it("prefers the session user id over the bookmarklet token", async () => {
    authMock.mockResolvedValue({ user: { id: "session-user" } });
    bookmarkletMock.mockResolvedValue("token-user");
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const route = withUserOrBookmarklet(handler);

    await route(req());

    expect(bookmarkletMock).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith("session-user", expect.anything());
  });

  it("falls back to the bookmarklet token when there is no session", async () => {
    authMock.mockResolvedValue(null);
    bookmarkletMock.mockResolvedValue("token-user");
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const route = withUserOrBookmarklet(handler);

    await route(req({ Authorization: "Bearer abc" }));

    expect(handler).toHaveBeenCalledWith("token-user", expect.anything());
  });
});
