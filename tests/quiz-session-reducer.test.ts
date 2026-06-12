import { describe, expect, it } from "vitest";
import {
  quizSessionReducer,
  initialQuizSessionState,
  type QuizSessionState,
} from "@/app/(private)/quiz/session-reducer";

const correct = { isCorrect: true, correctIndex: 1, explanation: "e" };
const wrong = { isCorrect: false, correctIndex: 1, explanation: "e" };

describe("quizSessionReducer", () => {
  it("marks a choice as selected and starts loading", () => {
    const next = quizSessionReducer(initialQuizSessionState, { type: "selectStart", choiceIndex: 2 });
    expect(next.selected).toBe(2);
    expect(next.loading).toBe(true);
  });

  it("ignores selectStart when a choice is already selected (double-answer guard)", () => {
    const selectedState: QuizSessionState = { ...initialQuizSessionState, selected: 0 };
    const next = quizSessionReducer(selectedState, { type: "selectStart", choiceIndex: 3 });
    expect(next).toBe(selectedState);
  });

  it("ignores selectStart while loading", () => {
    const loadingState: QuizSessionState = { ...initialQuizSessionState, loading: true };
    const next = quizSessionReducer(loadingState, { type: "selectStart", choiceIndex: 3 });
    expect(next).toBe(loadingState);
  });

  it("increments score on a correct result and stops loading", () => {
    const loading: QuizSessionState = { ...initialQuizSessionState, selected: 1, loading: true };
    const next = quizSessionReducer(loading, { type: "selectResult", result: correct });
    expect(next.score).toBe(1);
    expect(next.result).toEqual(correct);
    expect(next.loading).toBe(false);
  });

  it("keeps score unchanged on a wrong result", () => {
    const loading: QuizSessionState = { ...initialQuizSessionState, selected: 0, loading: true, score: 2 };
    const next = quizSessionReducer(loading, { type: "selectResult", result: wrong });
    expect(next.score).toBe(2);
    expect(next.result).toEqual(wrong);
  });

  it("advances to the next question and clears selection", () => {
    const answered: QuizSessionState = {
      ...initialQuizSessionState,
      index: 0,
      selected: 1,
      result: correct,
    };
    const next = quizSessionReducer(answered, { type: "next", total: 3 });
    expect(next.index).toBe(1);
    expect(next.selected).toBeNull();
    expect(next.result).toBeNull();
    expect(next.finished).toBe(false);
  });

  it("finishes the session after the last question", () => {
    const lastAnswered: QuizSessionState = {
      ...initialQuizSessionState,
      index: 2,
      selected: 1,
      result: correct,
    };
    const next = quizSessionReducer(lastAnswered, { type: "next", total: 3 });
    expect(next.finished).toBe(true);
    expect(next.index).toBe(2);
  });
});
