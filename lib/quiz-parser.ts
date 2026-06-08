// LLM が返すテキストからクイズ配列を「安全に」取り出す純粋ロジック。
// I/O（DB・ネットワーク）は持たず、入力文字列 → QuizItem[] の変換だけを担う。
// LLM 出力は不安定（前後に説明文が混ざる・壊れた JSON・型不正）なので、
// このモジュールが防御的にバリデーションして信頼できる構造だけを通す。

export type QuizItem = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

// 1問が QuizItem として成立しているかを実行時に検証する型ガード。
// answer は choices の範囲内インデックスであることまで確認する。
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

// LLM 応答テキストからクイズ配列を抽出する。
// 「```json ... ```」やコメント文が前後に付くことがあるため、最初の '[' から
// 最後の ']' までを正規表現で切り出してから JSON.parse する。
// パースできても不正な項目（型ガード不通過）は filter で捨て、残りだけ返す。
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
