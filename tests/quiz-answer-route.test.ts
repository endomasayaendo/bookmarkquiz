import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { POST } from "@/app/api/quizzes/[id]/answer/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findFirst: vi.fn(),
    },
    quizAnswer: {
      create: vi.fn(),
    },
  },
}));

const authMock = auth as unknown as Mock;
const findFirstMock = prisma.quiz.findFirst as unknown as Mock;
const createAnswerMock = prisma.quizAnswer.create as unknown as Mock;

function request(body: unknown) {
  return new Request("https://example.com/api/quizzes/quiz-1/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

const params = { params: Promise.resolve({ id: "quiz-1" }) };

describe("POST /api/quizzes/[id]/answer", () => {
  beforeEach(() => {
    authMock.mockReset();
    findFirstMock.mockReset();
    createAnswerMock.mockReset();
  });

  it("rejects unauthenticated users", async () => {
    authMock.mockResolvedValue(null);

    const res = await POST(request({ selectedIndex: 1 }), params);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects requests without a numeric selectedIndex", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(request({ selectedIndex: "1" }), params);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "selectedIndex is required" });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the quiz is not owned by the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue(null);

    const res = await POST(request({ selectedIndex: 1 }), params);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Quiz not found" });
  });

  it("creates an answer history entry and returns the result", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findFirstMock.mockResolvedValue({ answer: 2, explanation: "Because C is correct." });
    createAnswerMock.mockResolvedValue({});

    const res = await POST(request({ selectedIndex: 2 }), params);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      isCorrect: true,
      correctIndex: 2,
      explanation: "Because C is correct.",
    });
    expect(createAnswerMock).toHaveBeenCalledWith({
      data: { userId: "user-1", quizId: "quiz-1", isCorrect: true },
    });
  });
});
