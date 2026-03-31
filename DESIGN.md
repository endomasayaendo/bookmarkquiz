# bookmarkquiz-app 設計ドキュメント

## コンセプト

「技術記事を読んでも定着しない」課題を解決するWebアプリ。
ブックマークレットで記録し、AIが生成したクイズで復習する。

---

## アーキテクチャ

```
ブックマークレット（2本）          Webアプリ
┌──────────────────┐           ┌─────────────────────┐
│ ① あとで読む      │──API────▶│ ダッシュボード        │
│ ② 読んだ         │──API────▶│ 記事一覧             │
└──────────────────┘           │ クイズ               │
                               │ 振り返り             │
                               └─────────────────────┘
```

- ブックマークレットはChromeのブックマークバーに設置するJSボタン
- 記事URLはChromeのブックマークには保存されない
- 「読んだ」はupsert（記事未登録でも動く）

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 認証 | NextAuth.js (GitHub OAuth) |
| DB | Supabase (PostgreSQL) + Prisma |
| 本文取得 | Cheerio + fetch |
| クイズ生成 | Claude API (Sonnet) |
| Cron | Vercel Cron Jobs（1本に統合） |
| メール通知 | Resend |
| Push通知 | web-push |
| デプロイ | Vercel (Hobbyプラン) |

---

## DBスキーマ

### users
| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid | PK |
| github_id | string | |
| name | string | |
| email | string | |
| push_subscription | json | Web Push用 |
| created_at | timestamp | |

### articles
| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| url | string | |
| title | string | |
| ogp_image | string | 外部URL |
| body_text | text | 全文 |
| summary | text | Claude生成（未使用・将来用） |
| status | enum | unread / done |
| read_at | timestamp | 「読んだ」押した日時 |
| created_at | timestamp | |

### quizzes
| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid | PK |
| article_id | uuid | FK → articles |
| question | text | 問題文 |
| choices | json | 四択の選択肢配列 |
| answer | int | 正解のインデックス（0〜3） |
| explanation | text | 解説文 |
| type | enum | daily / weekly |
| created_at | timestamp | |

### quiz_answers
| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| quiz_id | uuid | FK → quizzes |
| is_correct | boolean | |
| answered_at | timestamp | |

---

## API設計

### 記事
| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/articles | 「あとで読む」ブックマークレット |
| POST | /api/articles/read | 「読んだ」ブックマークレット（upsert） |
| GET | /api/articles | 記事一覧（?status=unread\|done） |

### ダッシュボード
| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/dashboard | 未読数・読んだ数 |

### クイズ
| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/quizzes | クイズ一覧取得（?type=daily\|weekly、answerは含まない） |
| POST | /api/quizzes/:id/answer | 回答送信・サーバー側で正誤判定・quiz_answersに記録 |

### Cron
| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/cron/generate-quizzes | クイズ＋解説生成（日次毎日・週次は週末のみ） |
| POST | /api/cron/notify | 通知送信 |

---

## クイズ設計

### 生成ルール
- Vercel Cron 1本に統合（毎晩実行）
- 日次：その日読んだ記事を対象に生成
- 週次：週末のみ、今週読んだ全記事を対象に生成
- クイズと解説はバッチ時に同時生成してDBに保存
- モデル：Claude Sonnet
- 本文は全文そのままAPIに渡す

### さぼった場合
- 日次クイズは持ち越しなし（捨て）
- 週次クイズが安全網として今週分を全てカバー

### 回答フロー
1. クイズ一覧取得（answerは含まない）
2. ユーザーが選択肢を選んで送信
3. サーバー側で正誤判定
4. quiz_answersに記録
5. 全問終了後、振り返り画面へ

---

## 画面設計

### 1. ログイン
- GitHubログインボタンのみ

### 2. オンボーディング（初回のみ）
- ブックマークレット2本をドラッグでブックマークバーに追加
- チェックボックスで確認してから「はじめる」
- クリックした場合はalertで「ドラッグしてください」
- ダッシュボードから再設定できる動線あり

### 3. ダッシュボード
- 未読 N本 → タップ → 未読記事一覧
- 読んだ N本 → タップ → 読んだ記事一覧
- クイズへ進むボタン
- ブックマークレット再設定リンク

### 4. 記事一覧
- OGPカード形式
- タップで元記事を新タブで開く
- status別（unread / done）でフィルター済み（ダッシュボードから遷移）
- 同一ページを ?status= で使い分け

### 5. クイズ
- 進捗表示（N / M問）
- 出典：記事タイトル（テキストのみ、リンクなし）
- 問題文
- 四択ボタン（選択後に回答ボタン活性化）
- 回答ボタン

### 6. 振り返り
- スコア表示（N / M問正解）
- 各記事カード：
  - 正解 / 不正解バッジ
  - 問題文
  - あなたの回答（不正解時は赤）
  - 正解（不正解時のみ表示、緑）
  - 解説
  - 出典：記事タイトル（新タブリンク）
- ダッシュボードへ戻るボタン

---

## 認証

- GitHub OAuth（NextAuth.js）
- ブックマークレットはブラウザのCookieで認証
- 未ログイン時はalertで「ログインしてください」＋アプリURLを新タブで開く
- ブックマークレットとWebアプリは同一ドメイン（Vercel）

---

## MVP外

- タグ機能
- ブラウザ拡張機能（Phase 2）
