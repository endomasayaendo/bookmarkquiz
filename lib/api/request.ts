// API ルートのリクエスト入力を安全に読むための共通処理。
// 不正な入力で例外 → 500 にならないよう、ここで弾いて 400 を返せる形にする。

// リクエストボディを JSON として読む。壊れた JSON やオブジェクト以外は null。
export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// クエリパラメータを許可値リストで検証する。
// 未指定・空文字は { ok: true, value: null }（従来どおり絞り込みなし）、許可値以外は { ok: false }。
export function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[]
): { ok: true; value: T | null } | { ok: false } {
  if (value === null || value === "") return { ok: true, value: null };
  return (allowed as readonly string[]).includes(value)
    ? { ok: true, value: value as T }
    : { ok: false };
}
