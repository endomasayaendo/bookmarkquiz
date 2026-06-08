import type { NextAuthConfig } from "next-auth";

// middleware（Edge ランタイム）でも読み込める軽量な認証設定。
// Prisma など Node 専用の依存を持たないルート保護ロジックだけをここに置き、
// プロバイダ等の重い設定は auth.ts 側で合成する。
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 未ログインなら /login 以外へのアクセスを拒否する（ログインページは素通し）。
    // この戻り値で middleware がリダイレクト要否を判断する。
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname === "/login";
      if (!isLoggedIn && !isOnLoginPage) return false;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
