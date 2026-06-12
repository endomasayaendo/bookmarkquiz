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
- [ ] `lib/articles/url-rules.ts` / `extract.ts` / `fetch-body.ts`
- [ ] import更新4箇所、旧ファイル削除
- [ ] fetchFn注入テスト追加

## Phase 4: フロント共通部品 + Articles/Onboarding
- [ ] CenteredCard / lib/client/api.ts / useApiAction
- [ ] ArticleListItem / BookmarkletButton
- [ ] ArticlesClient / OnboardingClient 適用
- [ ] 新規テスト client-api / article-list-item

## Phase 5: QuizClient分解
- [ ] quiz/api.ts / session-reducer.ts / useQuizSession.ts / choice-style.ts
- [ ] QuizItem型をconfig.tsへ
- [ ] 新規テスト quiz-session-reducer / choice-style

## Phase 6: 最終検証
- [ ] test / lint / build / e2e
- [ ] git diff レビュー
- [ ] レビューセクション追記
