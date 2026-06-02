import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { POST } from "@/app/api/onboarding/complete/route";
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

describe("POST /api/onboarding/complete", () => {
  beforeEach(() => {
    authMock.mockReset();
    updateMock.mockReset();
  });

  it("rejects unauthenticated users", async () => {
    authMock.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("marks the current user's onboarding as completed", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    updateMock.mockResolvedValue({});

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingCompleted: true },
    });
  });
});
