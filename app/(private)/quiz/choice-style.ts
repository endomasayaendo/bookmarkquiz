import type { Result } from "./api";

// 選択肢ボタンのスタイルを決める純粋関数。
// 未回答時はニュートラル。回答後は、正解=緑 / 選んだ不正解=赤 / それ以外=淡色。
export function choiceStyle(i: number, selected: number | null, result: Result | null): string {
  let style = "border border-gray-200 bg-white text-gray-800 hover:border-gray-400";
  if (selected !== null && result) {
    if (i === result.correctIndex) {
      style = "border border-green-500 bg-green-50 text-green-800";
    } else if (i === selected && !result.isCorrect) {
      style = "border border-red-400 bg-red-50 text-red-800";
    } else {
      style = "border border-gray-200 bg-white text-gray-400";
    }
  }
  return style;
}
