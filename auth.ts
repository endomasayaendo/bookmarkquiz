import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

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
