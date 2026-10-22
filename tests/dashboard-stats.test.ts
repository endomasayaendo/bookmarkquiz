import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { getDashboardStats } from "@/lib/services/dashboard-stats";
import { GET } from "@/app/api/dashboard/route";
import { QUIZ_LOOKBACK_DAYS } from "@/app/(private)/quiz/config";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { count: vi.fn() },
    quiz: { count: vi.fn() },
    quizAnswer: { findMany: vi.fn() },
  },
}));

const authMock = auth as unknown as Mock;
const articleCountMock = prisma.article.count as unknown as Mock;
const quizCountMock = prisma.quiz.count as unknown as Mock;
const answerFindManyMock = prisma.quizAnswer.findMany as unknown as Mock;

// firstAnswers はクイズごとの初回回答の正誤（DB の distinct 済み結果を模す）。
function mockData(c: {
  unread: number;
  done: number;
  unanswered: number;
  firstAnswers: boolean[];
}) {
  articleCountMock.mockImplementation(({ where }) =>
    Promise.resolve(where.status === "unread" ? c.unread : c.done)
  );
  quizCountMock.mockResolvedValue(c.unanswered);
  answerFindManyMock.mockResolvedValue(c.firstAnswers.map((isCorrect) => ({ isCorrect })));
}

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("aggregates article counts and first-answer accuracy", async () => {
    mockData({ unread: 3, done: 5, unanswered: 4, firstAnswers: [true, true, false] });

    const stats = await getDashboardStats("user-1");

    expect(stats).toEqual({
      unreadCount: 3,
      doneCount: 5,
      unansweredQuizCount: 4,
      answeredQuizCount: 3,
      accuracy: 67,
    });
  });

  it("returns null accuracy when the user has not answered any quiz", async () => {
    mockData({ unread: 0, done: 0, unanswered: 0, firstAnswers: [] });

    const stats = await getDashboardStats("user-1");

    expect(stats.accuracy).toBeNull();
    expect(stats.answeredQuizCount).toBe(0);
  });

  it("counts only the first answer per quiz so review-mode retries don't inflate accuracy", async () => {
    mockData({ unread: 0, done: 0, unanswered: 0, firstAnswers: [] });

    await getDashboardStats("user-1");

    expect(answerFindManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      distinct: ["quizId"],
      orderBy: { answeredAt: "asc" },
      select: { isCorrect: true },
    });
  });

  it("counts unanswered quizzes within the same lookback window as the quiz page", async () => {
    mockData({ unread: 0, done: 0, unanswered: 0, firstAnswers: [] });

    await getDashboardStats("user-1");

    const { where } = quizCountMock.mock.calls[0][0];
    expect(where.article).toEqual({ userId: "user-1" });
    expect(where.quizAnswers).toEqual({ none: { userId: "user-1" } });
    const expectedSince = new Date();
    expectedSince.setDate(expectedSince.getDate() - QUIZ_LOOKBACK_DAYS);
    expect(Math.abs(where.createdAt.gte.getTime() - expectedSince.getTime())).toBeLessThan(5000);
    for (const [arg] of articleCountMock.mock.calls) {
      expect(arg.where.userId).toBe("user-1");
    }
  });
});

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    authMock.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/dashboard") as never, undefined);

    expect(res.status).toBe(401);
    expect(articleCountMock).not.toHaveBeenCalled();
  });

  it("returns the current user's dashboard stats", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    mockData({ unread: 1, done: 2, unanswered: 3, firstAnswers: [true, false, false, false] });

    const res = await GET(new Request("http://localhost/api/dashboard") as never, undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      unreadCount: 1,
      doneCount: 2,
      unansweredQuizCount: 3,
      answeredQuizCount: 4,
      accuracy: 25,
    });
  });
});
