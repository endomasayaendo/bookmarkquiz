import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  generateQuizzesForRecentArticles,
  type QuizLlm,
} from "@/lib/services/quiz-generation";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { findMany: vi.fn() },
    quiz: { createMany: vi.fn() },
  },
}));

const findManyMock = prisma.article.findMany as unknown as Mock;
const createManyMock = prisma.quiz.createMany as unknown as Mock;

const VALID_JSON = JSON.stringify([
  { question: "Q1", choices: ["a", "b", "c", "d"], answer: 0, explanation: "E1" },
  { question: "Q2", choices: ["a", "b", "c", "d"], answer: 1, explanation: "E2" },
]);

// content を返すだけの fake LLM。create に渡されたプロンプトを記録する。
function fakeLlm(content: string): { llm: QuizLlm; createSpy: Mock } {
  const createSpy = vi.fn(async () => ({ choices: [{ message: { content } }] }));
  return { llm: { chat: { completions: { create: createSpy } } }, createSpy };
}

describe("generateQuizzesForRecentArticles", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createManyMock.mockReset();
    createManyMock.mockResolvedValue({});
  });

  it("generates quizzes and stores them with type 'daily'", async () => {
    findManyMock.mockResolvedValue([{ id: "a1", title: "T1", bodyText: "body" }]);
    const { llm } = fakeLlm(VALID_JSON);

    const result = await generateQuizzesForRecentArticles({ llm });

    expect(result).toEqual({ generated: 2, skipped: 0, errors: 0, errorMessages: [] });
    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        { articleId: "a1", question: "Q1", choices: ["a", "b", "c", "d"], answer: 0, explanation: "E1", type: "daily" },
        { articleId: "a1", question: "Q2", choices: ["a", "b", "c", "d"], answer: 1, explanation: "E2", type: "daily" },
      ],
    });
  });

  it("truncates the article body to 8000 chars in the prompt", async () => {
    const longBody = "x".repeat(9000);
    findManyMock.mockResolvedValue([{ id: "a1", title: "T1", bodyText: longBody }]);
    const { llm, createSpy } = fakeLlm(VALID_JSON);

    await generateQuizzesForRecentArticles({ llm });

    const prompt: string = createSpy.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("x".repeat(8000));
    expect(prompt).not.toContain("x".repeat(8001));
  });

  it("counts a parse failure as an error and continues with other articles", async () => {
    findManyMock.mockResolvedValue([
      { id: "a1", title: "T1", bodyText: "body" },
      { id: "a2", title: "T2", bodyText: "body" },
    ]);
    // 1件目は壊れた応答、2件目は正常。
    const createSpy = vi
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { content: "no json here" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: VALID_JSON } }] });
    const llm: QuizLlm = { chat: { completions: { create: createSpy } } };

    const result = await generateQuizzesForRecentArticles({ llm });

    expect(result.errors).toBe(1);
    expect(result.errorMessages).toHaveLength(1);
    expect(result.generated).toBe(2);
    expect(createManyMock).toHaveBeenCalledTimes(1);
  });

  it("counts an LLM rejection as an error", async () => {
    findManyMock.mockResolvedValue([{ id: "a1", title: "T1", bodyText: "body" }]);
    const createSpy = vi.fn().mockRejectedValue(new Error("LLM down"));
    const llm: QuizLlm = { chat: { completions: { create: createSpy } } };

    const result = await generateQuizzesForRecentArticles({ llm });

    expect(result).toEqual({
      generated: 0,
      skipped: 0,
      errors: 1,
      errorMessages: ["LLM down"],
    });
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("returns an empty result when no articles match", async () => {
    findManyMock.mockResolvedValue([]);
    const { llm, createSpy } = fakeLlm(VALID_JSON);

    const result = await generateQuizzesForRecentArticles({ llm });

    expect(result).toEqual({ generated: 0, skipped: 0, errors: 0, errorMessages: [] });
    expect(createSpy).not.toHaveBeenCalled();
  });
});
