export type QuizItem = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export function isValidQuiz(q: unknown): q is QuizItem {
  if (!q || typeof q !== "object") return false;
  const { question, choices, answer, explanation } = q as Record<string, unknown>;
  return (
    typeof question === "string" &&
    question.length > 0 &&
    Array.isArray(choices) &&
    choices.length >= 2 &&
    choices.every((c) => typeof c === "string") &&
    typeof answer === "number" &&
    Number.isInteger(answer) &&
    answer >= 0 &&
    answer < choices.length &&
    typeof explanation === "string"
  );
}

export function parseQuizzes(text: string): QuizItem[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  let parsed: unknown[];
  try {
    parsed = JSON.parse(match[0]) as unknown[];
  } catch {
    throw new Error("No JSON array found in response");
  }
  return parsed.filter(isValidQuiz);
}
