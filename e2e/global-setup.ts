import { execSync } from "node:child_process";
import { Client } from "pg";

// 固定IDで seed すると、Dev Login（emailでupsert）が同じユーザーを返すので
// 記事・クイズの FK をテスト前に用意できる。
const DEMO_EMAIL = "demo@example.com";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const ARTICLE_ID = "00000000-0000-0000-0000-0000000000a1";
const QUIZ_ID = "00000000-0000-0000-0000-0000000000b1";

// E2E実行前に一度だけ走る。
// 1) テストDBにschemaを投入（既に同期済みなら no-op）
// 2) demoユーザーと関連データを作り直し、毎回同じ初期状態から始める
export default async function globalSetup() {
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: process.env,
  });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // ユーザー削除で記事・クイズ・回答も連鎖削除される（onDelete: Cascade）
    await client.query("DELETE FROM users WHERE email = $1", [DEMO_EMAIL]);
    await client.query(
      `INSERT INTO users (id, email, name, onboarding_completed)
       VALUES ($1, $2, 'Demo User', false)`,
      [USER_ID, DEMO_EMAIL],
    );
    // 記事一覧テスト用の「読んだ」記事
    await client.query(
      `INSERT INTO articles (id, user_id, url, title, status, body_text, read_at)
       VALUES ($1, $2, $3, $4, 'done', 'サンプル本文', now())`,
      [ARTICLE_ID, USER_ID, "https://qiita.com/e2e/items/sample", "E2Eテスト用の記事"],
    );
    // クイズ回答テスト用のクイズ（正解インデックス = 1）
    await client.query(
      `INSERT INTO quizzes (id, article_id, question, choices, answer, explanation, type)
       VALUES ($1, $2, $3, $4::jsonb, 1, $5, 'daily')`,
      [
        QUIZ_ID,
        ARTICLE_ID,
        "BookmarkQuizは何から生成される？",
        JSON.stringify(["メモ", "クイズ", "ブックマーク", "メール"]),
        "読んだ記事からクイズが生成されます。",
      ],
    );
  } finally {
    await client.end();
  }
}
