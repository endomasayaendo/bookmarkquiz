import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBookmarkletUserId } from "@/lib/bookmarklet-auth";
import { CORS_HEADERS } from "@/lib/cors";

// API ルートの認証を共通化するラッパー群。
// 各ルートで繰り返していた「セッション確認 → 401」の定型処理をここに集約し、
// ハンドラ本体は認証済みの userId を受け取って業務ロジックだけに集中できるようにする。

// エラーレスポンスの定型。ボディは { error } 固定（既存クライアント・テスト互換）。
export function jsonError(error: string, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error }, headers ? { status, headers } : { status });
}

// セッション必須ルート用ラッパー。未ログインは 401 を返し、
// ログイン済みなら userId をハンドラに渡す。動的ルートの ctx（params）は
// ジェネリクスでそのまま透過させる。
export function withSession<Ctx = unknown>(
  handler: (userId: string, req: NextRequest, ctx: Ctx) => Promise<Response> | Response
): (req: NextRequest, ctx: Ctx) => Promise<Response> {
  return async (req: NextRequest, ctx: Ctx) => {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }
    return handler(session.user.id, req, ctx);
  };
}

// Web セッションとブックマークレットトークンの両方を受け付けるルート用ラッパー。
// ブックマークレットはクロスオリジン実行のため、未認証 401 にも CORS ヘッダを付ける。
export function withUserOrBookmarklet(
  handler: (userId: string, req: NextRequest) => Promise<Response>
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    const session = await auth();
    const userId = session?.user?.id ?? (await getBookmarkletUserId(req));
    if (!userId) {
      return jsonError("Unauthorized", 401, CORS_HEADERS);
    }
    return handler(userId, req);
  };
}
