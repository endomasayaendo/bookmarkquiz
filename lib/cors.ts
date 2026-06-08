// ブックマークレット（外部サイト上で動く）から叩かれる API 用の CORS 設定。
// 任意オリジンからの POST/OPTIONS を許可する。レスポンスにこのヘッダを
// 付ける責任は各ルート側にあり、ここは定義と preflight 応答だけを提供する。
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

// preflight（OPTIONS）への定型応答。本文なし 204 + CORS ヘッダ。
export function corsPreflightResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
