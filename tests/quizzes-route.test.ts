import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { GET } from "@/app/api/quizzes/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findMany: vi.fn(),
    },
  },
}));

const authMock = auth as unknown as Mock;
const findManyMock = prisma.quiz.findMany as unknown as Mock;

describe("GET /api/quizzes", () => {
  beforeEach(() => {
    authMock.mockReset();
    findManyMock.mockReset();
  });

  it("filters by a valid type", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findManyMock.mockResolvedValue([]);

    const res = await GET(new Request("https://example.com/api/quizzes?type=daily") as never);

    expect(res.status).toBe(200);
    expect(findManyMock.mock.calls[0][0].where).toEqual({
      article: { userId: "user-1" },
      type: "daily",
    });
  });

  it("rejects an unknown type with 400", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await GET(new Request("https://example.com/api/quizzes?type=bogus") as never);

    expect(res.status).toBe(400);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
