import { describe, expect, it } from "vitest";
import { choiceStyle } from "@/app/(private)/quiz/choice-style";

const correctResult = { isCorrect: true, correctIndex: 1, explanation: "e" };
const wrongResult = { isCorrect: false, correctIndex: 1, explanation: "e" };

describe("choiceStyle", () => {
  it("returns the neutral style before answering", () => {
    expect(choiceStyle(0, null, null)).toContain("text-gray-800");
    expect(choiceStyle(0, null, null)).toContain("hover:border-gray-400");
  });

  it("highlights the correct choice in green after answering", () => {
    expect(choiceStyle(1, 1, correctResult)).toContain("border-green-500");
    expect(choiceStyle(1, 3, wrongResult)).toContain("border-green-500");
  });

  it("marks the chosen wrong answer in red", () => {
    expect(choiceStyle(3, 3, wrongResult)).toContain("border-red-400");
  });

  it("dims the other choices", () => {
    expect(choiceStyle(2, 3, wrongResult)).toContain("text-gray-400");
  });
});
