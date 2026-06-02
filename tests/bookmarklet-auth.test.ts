import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { getBookmarkletUserId } from "../lib/bookmarklet-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const findUnique = prisma.user.findUnique as unknown as Mock;

describe("getBookmarkletUserId", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns null when Authorization header is missing", async () => {
    const req = new Request("https://example.com");

    await expect(getBookmarkletUserId(req)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns null when Authorization header is not a Bearer token", async () => {
    const req = new Request("https://example.com", { headers: { Authorization: "Basic abc" } });

    await expect(getBookmarkletUserId(req)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("looks up a user by bookmarklet token", async () => {
    findUnique.mockResolvedValue({ id: "user-1" });
    const req = new Request("https://example.com", { headers: { Authorization: "Bearer token-1" } });

    await expect(getBookmarkletUserId(req)).resolves.toBe("user-1");
    expect(findUnique).toHaveBeenCalledWith({
      where: { bookmarkletToken: "token-1" },
      select: { id: true },
    });
  });
});
