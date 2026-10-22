import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { notifyUsersWithNewQuizzes, type EmailSender } from "@/lib/services/notify";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    quiz: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}));

const findManyMock = prisma.user.findMany as unknown as Mock;
const quizFindManyMock = prisma.quiz.findMany as unknown as Mock;
const quizUpdateManyMock = prisma.quiz.updateMany as unknown as Mock;

function fakeMailer(): { mailer: EmailSender; sendSpy: Mock } {
  const sendSpy = vi.fn(async () => ({ data: { id: "email-1" }, error: null }));
  return { mailer: { emails: { send: sendSpy } }, sendSpy };
}

const users = [
  { id: "u1", email: "a@example.com" },
  { id: "u2", email: "b@example.com" },
];

describe("notifyUsersWithNewQuizzes", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    quizFindManyMock.mockReset();
    quizUpdateManyMock.mockReset();
    quizFindManyMock.mockResolvedValue([{ id: "q1" }, { id: "q2" }]);
    quizUpdateManyMock.mockResolvedValue({ count: 2 });
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("RESEND_FROM", "noreply@example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends an email to each eligible user with the expected subject and recipient", async () => {
    findManyMock.mockResolvedValue(users);
    const { mailer, sendSpy } = fakeMailer();

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 2, errors: 0 });
    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy.mock.calls[0][0]).toMatchObject({
      from: "noreply@example.com",
      to: "a@example.com",
      subject: "【BookmarkQuiz】今日のクイズができました",
    });
    expect(sendSpy.mock.calls[0][0].html).toContain("https://app.example/quiz");
  });

  it("only targets quizzes that have not been notified yet", async () => {
    findManyMock.mockResolvedValue([users[0]]);
    const { mailer } = fakeMailer();

    await notifyUsersWithNewQuizzes({ mailer });

    expect(findManyMock.mock.calls[0][0].where.articles.some.quizzes.some).toMatchObject({
      notifiedAt: null,
    });
    expect(quizUpdateManyMock).toHaveBeenCalledWith({
      where: { id: { in: ["q1", "q2"] }, notifiedAt: null },
      data: { notifiedAt: expect.any(Date) },
    });
  });

  it("does not send when another run already claimed the quizzes", async () => {
    findManyMock.mockResolvedValue([users[0]]);
    quizUpdateManyMock.mockResolvedValue({ count: 0 });
    const { mailer, sendSpy } = fakeMailer();

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 0, errors: 0 });
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("counts a thrown send failure without stopping the loop and releases the claim", async () => {
    findManyMock.mockResolvedValue(users);
    const sendSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error("bounce"))
      .mockResolvedValueOnce({ data: { id: "email-2" }, error: null });
    const mailer: EmailSender = { emails: { send: sendSpy } };

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 1, errors: 1 });
    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(quizUpdateManyMock).toHaveBeenCalledWith({
      where: { id: { in: ["q1", "q2"] }, notifiedAt: expect.any(Date) },
      data: { notifiedAt: null },
    });
  });

  it("counts an error returned by Resend (which does not throw) as a failure", async () => {
    findManyMock.mockResolvedValue([users[0]]);
    const sendSpy = vi.fn(async () => ({ data: null, error: { message: "domain not verified" } }));
    const mailer: EmailSender = { emails: { send: sendSpy } };

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 0, errors: 1 });
    expect(quizUpdateManyMock).toHaveBeenLastCalledWith({
      where: { id: { in: ["q1", "q2"] }, notifiedAt: expect.any(Date) },
      data: { notifiedAt: null },
    });
  });

  it("returns zero counts when no users match", async () => {
    findManyMock.mockResolvedValue([]);
    const { mailer, sendSpy } = fakeMailer();

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 0, errors: 0 });
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("skips sending without querying when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await notifyUsersWithNewQuizzes();

    expect(result).toEqual({ sent: 0, errors: 0 });
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
