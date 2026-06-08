import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

// アプリ本体（Node ランタイム）用の Auth.js セットアップ。
// auth.config の共通設定に、Prisma アダプタと各認証プロバイダを足して
// handlers / auth() などをエクスポートする。セッションは JWT 戦略。
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // 開発環境でだけ有効な「Dev ログイン」。本人確認をスキップして
    // 固定のデモユーザーでログインする。本番(NODE_ENV=production)では
    // 配列が空になり provider 自体が存在しない。
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {},
            authorize: async () => {
              return prisma.user.upsert({
                where: { email: "demo@example.com" },
                update: {},
                create: { email: "demo@example.com", name: "Demo User" },
              });
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // 初回サインイン時にユーザー ID を JWT へ載せ、以降の session() で
    // session.user.id として参照できるようにする（DB を引かずに本人特定）。
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
