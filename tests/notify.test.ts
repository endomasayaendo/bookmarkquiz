import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { notifyUsersWithNewQuizzes, type EmailSender } from "@/lib/services/notify";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

const findManyMock = prisma.user.findMany as unknown as Mock;

function fakeMailer(): { mailer: EmailSender; sendSpy: Mock } {
  const sendSpy = vi.fn(async () => ({ id: "email-1" }));
  return { mailer: { emails: { send: sendSpy } }, sendSpy };
}

describe("notifyUsersWithNewQuizzes", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("RESEND_FROM", "noreply@example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends an email to each eligible user with the expected subject and recipient", async () => {
    findManyMock.mockResolvedValue([{ email: "a@example.com" }, { email: "b@example.com" }]);
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

  it("counts a send failure without stopping the loop", async () => {
    findManyMock.mockResolvedValue([{ email: "a@example.com" }, { email: "b@example.com" }]);
    const sendSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error("bounce"))
      .mockResolvedValueOnce({ id: "email-2" });
    const mailer: EmailSender = { emails: { send: sendSpy } };

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 1, errors: 1 });
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it("returns zero counts when no users match", async () => {
    findManyMock.mockResolvedValue([]);
    const { mailer, sendSpy } = fakeMailer();

    const result = await notifyUsersWithNewQuizzes({ mailer });

    expect(result).toEqual({ sent: 0, errors: 0 });
    expect(sendSpy).not.toHaveBeenCalled();
  });
});
