import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { getDashboardStats } from "@/lib/services/dashboard-stats";
import { GET } from "@/app/api/dashboard/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { count: vi.fn() },
    quiz: { count: vi.fn() },
    quizAnswer: { count: vi.fn() },
  },
}));

const authMock = auth as unknown as Mock;
const articleCountMock = prisma.article.count as unknown as Mock;
const quizCountMock = prisma.quiz.count as unknown as Mock;
const answerCountMock = prisma.quizAnswer.count as unknown as Mock;

// 引数の where に応じて件数を返すよう各 count モックを設定する。
function mockCounts(c: {
  unread: number;
  done: number;
  unanswered: number;
  answers: number;
  correct: number;
}) {
  articleCountMock.mockImplementation(({ where }) =>
    Promise.resolve(where.status === "unread" ? c.unread : c.done)
  );
  quizCountMock.mockResolvedValue(c.unanswered);
  answerCountMock.mockImplementation(({ where }) =>
    Promise.resolve(where.isCorrect ? c.correct : c.answers)
  );
}

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("aggregates article counts and quiz answer stats", async () => {
    mockCounts({ unread: 3, done: 5, unanswered: 4, answers: 6, correct: 4 });

    const stats = await getDashboardStats("user-1");

    expect(stats).toEqual({
      unreadCount: 3,
      doneCount: 5,
      unansweredQuizCount: 4,
      answerCount: 6,
      accuracy: 67,
    });
  });

  it("returns null accuracy when the user has not answered any quiz", async () => {
    mockCounts({ unread: 0, done: 0, unanswered: 0, answers: 0, correct: 0 });

    const stats = await getDashboardStats("user-1");

    expect(stats.accuracy).toBeNull();
    expect(stats.answerCount).toBe(0);
  });

  it("scopes every query to the given user", async () => {
    mockCounts({ unread: 0, done: 0, unanswered: 0, answers: 0, correct: 0 });

    await getDashboardStats("user-1");

    expect(quizCountMock).toHaveBeenCalledWith({
      where: { article: { userId: "user-1" }, quizAnswers: { none: { userId: "user-1" } } },
    });
    expect(answerCountMock).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(answerCountMock).toHaveBeenCalledWith({
      where: { userId: "user-1", isCorrect: true },
    });
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
    mockCounts({ unread: 1, done: 2, unanswered: 3, answers: 4, correct: 1 });

    const res = await GET(new Request("http://localhost/api/dashboard") as never, undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      unreadCount: 1,
      doneCount: 2,
      unansweredQuizCount: 3,
      answerCount: 4,
      accuracy: 25,
    });
  });
});
