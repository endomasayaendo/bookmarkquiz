"use client";

import { useTransition } from "react";

// 「API 操作中はUIを薄く/ボタンを無効化する」という pending 状態管理を共通化する。
// useTransition の薄いラッパー。run に渡した処理（同期・非同期どちらも可）の
// 実行中は isPending が true になる。
export function useApiAction(): {
  isPending: boolean;
  run: (action: () => Promise<void> | void) => void;
} {
  const [isPending, startTransition] = useTransition();
  return {
    isPending,
    run: (action) => startTransition(action),
  };
}
