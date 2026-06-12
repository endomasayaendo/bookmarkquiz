# SOLID リファクタリング TODO

挙動完全維持の pure refactor。各フェーズ末に `npm test` / `npm run lint`（必要に応じ build / e2e）を green に保つ。
詳細計画: `~/.claude/plans/vast-jingling-goblet.md`

## Phase 0: ベースライン
- [x] test 37 / lint エラー0 / build 成功 を確認

## Phase 1: API認証ヘルパー抽出
- [x] `lib/api/auth.ts`（withSession / withUserOrBookmarklet / jsonError）
- [x] `lib/api/cron-auth.ts`（isAuthorizedCronRequest: Bearer/生値 統一）
- [x] 9セッションルート + dual-auth 2ルート + cron 2ルートを置換
- [x] 新規テスト `tests/api-auth.test.ts` / `tests/cron-auth.test.ts`
- [x] 検証: test 49 / lint エラー0 / build 成功
- 備考: notify の cron 認証が「生値のみ」→「Bearer or 生値」のスーパーセットに統一（後方互換）。

## Phase 2: cronサービス抽出
- [x] `lib/services/quiz-generation.ts`（LLM注入可・遅延生成）
- [x] `lib/services/notify.ts`（mailer注入可・遅延生成）
- [x] cron 2ルートを「認証→サービス呼び出し」の薄い形に
- [x] 新規テスト quiz-generation（5ケース）/ notify（3ケース）
- [x] 検証: test 57 / lint エラー0

## Phase 3: article-content 3分割
- [x] `lib/articles/url-rules.ts`（URL検証・OCP）/ `extract.ts`（cheerio純粋関数）/ `fetch-body.ts`（I/O・SSRF防御・fetchFn注入可）
- [x] import更新3ルート、旧 lib/article-content.ts 削除
- [x] テストも3ファイルに分割（url-rules / extract / fetch-body）+ fetchFn注入・Disallowedケース追加
- [x] 検証: test 59 / lint エラー0 / build 成功

## Phase 4: フロント共通部品 + Articles/Onboarding
- [x] `lib/client/api.ts`（callApi）/ `hooks/useApiAction.ts`
- [x] `articles/article-style.ts`（純関数）/ `ArticleListItem.tsx` / `onboarding/BookmarkletButton.tsx`
- [x] ArticlesClient（111→59行）/ OnboardingClient 適用
- [x] 新規テスト client-api（4ケース）/ article-style（4ケース）
- [x] 検証: test 67 / lint エラー0 / build 成功
- 備考: CenteredCard は実利用が QuizClient なので Phase 5 で作成。e2e(articles/onboarding) は Phase 6 でまとめて実行。

## Phase 5: QuizClient分解
- [x] quiz/api.ts（submitQuizAnswer）/ session-reducer.ts（純粋reducer）/ useQuizSession.ts / choice-style.ts
- [x] components/CenteredCard.tsx（空状態・結果の全画面カード共通化）
- [x] QuizItem型をconfig.tsへ移動（client→serverページ依存を解消）
- [x] QuizClient 189→約130行に縮小、state機械をフックへ委譲
- [x] 新規テスト quiz-session-reducer（7ケース）/ choice-style（4ケース）
- [x] 検証: test 78 / lint エラー0 / build 成功

## Phase 6: 最終検証
- [ ] test / lint / build / e2e
- [ ] git diff レビュー
- [ ] レビューセクション追記
