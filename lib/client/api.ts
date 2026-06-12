// クライアントから API を叩くときの共通ラッパー。
// fetch + JSON パースの定型と、失敗時の error 取り出しを一箇所にまとめる。
// 「失敗時に alert するか黙って無視するか」は呼び出し側の判断に委ねるため、
// ここでは結果を構造化して返すだけにする（副作用を持たない）。
export async function callApi<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  const res = await fetch(input, init);
  // 204 など本文なし・非JSON応答でも落ちないよう、パース失敗は null 扱い。
  const body = (await res.json().catch(() => null)) as unknown;

  if (res.ok) {
    return { ok: true, status: res.status, data: (body as T | null) ?? null, error: null };
  }

  const error =
    body && typeof body === "object" && "error" in body
      ? ((body as { error?: unknown }).error as string | null) ?? null
      : null;
  return { ok: false, status: res.status, data: null, error };
}
