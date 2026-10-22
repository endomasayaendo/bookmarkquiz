import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/cron/notify/route";
import { notifyUsersWithNewQuizzes } from "@/lib/services/notify";

vi.mock("@/lib/services/notify", () => ({
  notifyUsersWithNewQuizzes: vi.fn(),
}));

const notifyMock = notifyUsersWithNewQuizzes as unknown as Mock;

function req(method: string, authorization?: string) {
  return new NextRequest("https://example.com/api/cron/notify", {
    method,
    headers: authorization ? { Authorization: authorization } : {},
  });
}

describe("/api/cron/notify", () => {
  beforeEach(() => {
    notifyMock.mockReset();
    notifyMock.mockResolvedValue({ sent: 1, errors: 0 });
    vi.stubEnv("CRON_SECRET", "s3cret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs the notification on GET (how Vercel Cron calls it)", async () => {
    const res = await GET(req("GET", "Bearer s3cret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 1, errors: 0 });
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("also accepts POST for manual runs", async () => {
    const res = await POST(req("POST", "Bearer s3cret"));

    expect(res.status).toBe(200);
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("rejects requests without the cron secret", async () => {
    const res = await GET(req("GET"));

    expect(res.status).toBe(401);
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
