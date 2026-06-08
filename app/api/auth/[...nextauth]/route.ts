// Auth.js のサインイン/コールバック等を処理するエンドポイント。
// 実体は auth.ts が生成した handlers で、ここはルートに公開するだけ。
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
