import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// アプリ全体で共有する PrismaClient シングルトンを提供する。
// 開発時は HMR でモジュールが再評価されるたびに新しい接続プールが増殖して
// しまうため、globalThis にインスタンスをキャッシュして使い回す。
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 3,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 本番は毎回新規生成（プロセスが使い捨て）。開発のみキャッシュへ保持する。
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
