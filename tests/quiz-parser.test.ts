import { describe, expect, it } from "vitest";
import { isValidQuiz, parseQuizzes } from "../lib/quiz-parser";

const validQuiz = {
  question: "What does BookmarkQuiz generate from read articles?",
  choices: ["Notes", "Quizzes", "Bookmarks", "Emails"],
  answer: 1,
  explanation: "BookmarkQuiz generates quizzes from articles marked as read.",
};

describe("isValidQuiz", () => {
  it("accepts a complete quiz item", () => {
    expect(isValidQuiz(validQuiz)).toBe(true);
  });

  it("rejects a quiz whose answer index is outside the choices", () => {
    expect(isValidQuiz({ ...validQuiz, answer: 4 })).toBe(false);
  });

  it("rejects a quiz with non-string choices", () => {
    expect(isValidQuiz({ ...validQuiz, choices: ["A", 2] })).toBe(false);
  });
});

describe("parseQuizzes", () => {
  it("extracts a JSON array from surrounding model text", () => {
    const text = `Here is the quiz:\n${JSON.stringify([validQuiz])}\nGood luck!`;

    expect(parseQuizzes(text)).toEqual([validQuiz]);
  });

  it("filters invalid quiz items from the parsed array", () => {
    const invalidQuiz = { ...validQuiz, answer: -1 };
    const text = JSON.stringify([invalidQuiz, validQuiz]);

    expect(parseQuizzes(text)).toEqual([validQuiz]);
  });

  it("throws when no JSON array exists", () => {
    expect(() => parseQuizzes("No structured data here")).toThrow("No JSON array found");
  });
});
