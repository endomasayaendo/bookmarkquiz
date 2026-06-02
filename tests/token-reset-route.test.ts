import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { POST } from "@/app/api/token/reset/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

const authMock = auth as unknown as Mock;
const updateMock = prisma.user.update as unknown as Mock;

describe("POST /api/token/reset", () => {
  beforeEach(() => {
    authMock.mockReset();
    updateMock.mockReset();
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    authMock.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("replaces the current user's bookmarklet token", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    updateMock.mockResolvedValue({});
    vi.spyOn(crypto, "randomUUID").mockReturnValue("new-token" as `${string}-${string}-${string}-${string}-${string}`);

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { bookmarkletToken: "new-token" },
    });
  });
});
