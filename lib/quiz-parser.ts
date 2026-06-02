export type QuizItem = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export function isValidQuiz(q: unknown): q is QuizItem {
  if (!q || typeof q !== "object") return false;
  const item = q as Record<string, unknown>;
  return (
    typeof item.question === "string" &&
    item.question.length > 0 &&
    Array.isArray(item.choices) &&
    item.choices.length >= 2 &&
    item.choices.every((c) => typeof c === "string") &&
    Number.isInteger(item.answer) &&
    (item.answer as number) >= 0 &&
    (item.answer as number) < item.choices.length &&
    typeof item.explanation === "string"
  );
}

export function parseQuizzes(text: string): QuizItem[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  const parsed = JSON.parse(match[0]) as unknown[];
  return parsed.filter(isValidQuiz);
}
