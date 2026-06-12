"use client";

import { useEffect, useRef } from "react";

type Props = {
  href: string;
  label: string;
  highlighted: boolean;
  baseClass: string; // 例: "bg-blue-600 hover:bg-blue-500"
  ringClass: string; // 例: "ring-blue-300"
  onDragStart: () => void;
};

// ブックマークレット1本分のドラッグ可能なボタン。
// javascript: URL は JSX の href に直接書くと React/リンタに嫌われるため、
// マウント後に DOM 属性として直接セットして回避する。
// クリックは誤操作（ドラッグして登録するのが正しい）なので案内を出す。
export default function BookmarkletButton({
  href,
  label,
  highlighted,
  baseClass,
  ringClass,
  onDragStart,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    ref.current?.setAttribute("href", href);
  }, [href]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    alert("ドラッグしてブックマークバーに追加してください");
  }

  return (
    <a
      ref={ref}
      onClick={handleClick}
      onDragStart={onDragStart}
      className={`flex-1 rounded-lg ${baseClass} px-4 py-3 text-center text-sm font-medium text-white cursor-grab transition-all duration-300 ${
        highlighted ? `ring-4 ${ringClass} ring-offset-2 scale-105` : ""
      }`}
    >
      {label}
    </a>
  );
}
