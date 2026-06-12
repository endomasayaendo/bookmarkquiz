import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  maxWidth?: string; // カードの最大幅（Tailwind クラス）
  cardClassName?: string; // カード内側の余白・配置など
};

// 画面中央に白いカードを1枚置くだけの共通シェル。
// クイズの空状態・結果表示など、全画面センタリングのカードで再利用する。
export default function CenteredCard({
  children,
  maxWidth = "max-w-md",
  cardClassName = "p-8 text-center",
}: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-sm ${cardClassName}`}>
        {children}
      </div>
    </div>
  );
}
