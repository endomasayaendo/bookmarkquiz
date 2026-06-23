import "dotenv/config";
import { Client } from "pg";

// ローカルで Groq なしにアプリ全体（クイズ回答まで）を体験するためのデモデータ投入。
// 手書きの固定データを直接 INSERT するので、ブックマークレットも Groq も不要。
//
// 事前に `prisma db push` でスキーマを投入し、DATABASE_URL をローカルDBに向けて実行する:
//   npm run db:seed

const DEMO_EMAIL = "demo@example.com";
// Dev Login は email で upsert するため、固定IDで作っておくと記事・クイズの FK を先に用意できる。
const USER_ID = "00000000-0000-0000-0000-000000000001";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL が未設定です。");

// 安全装置：本番Supabase等への誤投入を防ぐ。ローカルDB以外は明示許可がない限り拒否する。
const { hostname } = new URL(databaseUrl);
if (!["localhost", "127.0.0.1"].includes(hostname) && process.env.SEED_ALLOW_REMOTE !== "true") {
  throw new Error(
    `安全のためローカルDB以外への seed を拒否しました (host: ${hostname})。` +
      ` 意図的に実行する場合のみ SEED_ALLOW_REMOTE=true を付けてください。`,
  );
}

// デモ用の記事とクイズ（Groq不要・手書きの固定データ）
const articles = [
  {
    id: "00000000-0000-0000-0000-0000000000a1",
    url: "https://qiita.com/demo/items/react-rerender",
    title: "Reactのリレンダリングを理解する",
    status: "done",
    quizzes: [
      {
        id: "00000000-0000-0000-0000-0000000000b1",
        question: "Reactでコンポーネントが再レンダリングされる主な要因は？",
        choices: ["CSSの変更", "stateやpropsの変化", "HTMLの保存", "ブラウザの拡大"],
        answer: 1,
        explanation: "state や props が変化すると、そのコンポーネントは再レンダリングされます。",
      },
      {
        id: "00000000-0000-0000-0000-0000000000b2",
        question: "計算結果をメモ化して無駄な再計算を防ぐフックは？",
        choices: ["useMemo", "useFetch", "useStyle", "useRouter"],
        answer: 0,
        explanation: "useMemo は依存配列が変わらない限り計算結果を再利用します。",
      },
    ],
  },
  {
    id: "00000000-0000-0000-0000-0000000000a2",
    url: "https://zenn.dev/demo/articles/ts-inference",
    title: "TypeScriptの型推論入門",
    status: "done",
    quizzes: [
      {
        id: "00000000-0000-0000-0000-0000000000b3",
        question: "TypeScriptが値から型を自動的に決める仕組みは？",
        choices: ["型キャスト", "型推論", "型消去", "型注釈"],
        answer: 1,
        explanation: "初期値などから型を自動で決めることを型推論と呼びます。",
      },
    ],
  },
  {
    id: "00000000-0000-0000-0000-0000000000a3",
    url: "https://qiita.com/demo/items/unread-sample",
    title: "あとで読む（未読サンプル）",
    status: "unread",
    quizzes: [],
  },
];

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  // demoユーザーを作り直す（onDelete: Cascade で記事・クイズ・回答も消える）。
  // 何度実行しても同じ初期状態になる。
  // onboarding_completed=false にして、ローカルでもログイン直後に
  // オンボーディング（ブックマークレット設置）から一周体験できるようにする。
  // 完了後はシード済みの記事・クイズが入ったダッシュボードに着く。
  await client.query("DELETE FROM users WHERE email = $1", [DEMO_EMAIL]);
  await client.query(
    `INSERT INTO users (id, email, name, onboarding_completed)
     VALUES ($1, $2, 'Demo User', false)`,
    [USER_ID, DEMO_EMAIL],
  );

  for (const a of articles) {
    // status は自前の固定値なのでリテラル埋め込みで安全（enum へのキャスト不要）。
    const readAt = a.status === "done" ? "now()" : "NULL";
    await client.query(
      `INSERT INTO articles (id, user_id, url, title, status, body_text, read_at)
       VALUES ($1, $2, $3, $4, '${a.status}', $5, ${readAt})`,
      [a.id, USER_ID, a.url, a.title, "デモ用の記事本文（サンプル）。"],
    );
    for (const q of a.quizzes) {
      await client.query(
        `INSERT INTO quizzes (id, article_id, question, choices, answer, explanation, type)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'daily')`,
        [q.id, a.id, q.question, JSON.stringify(q.choices), q.answer, q.explanation],
      );
    }
  }

  const quizCount = articles.reduce((n, a) => n + a.quizzes.length, 0);
  console.log(`✅ seed完了: 記事 ${articles.length} 件 / クイズ ${quizCount} 件（demo@example.com）`);
} finally {
  await client.end();
}
