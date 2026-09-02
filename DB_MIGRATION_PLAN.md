# DB移行手順

## Phase 0 — 今回
- schema.sql完成
- migration dry-run
- 環境変数定義
- API/DB分離の準備

## Phase 1 — DB作成
Supabase/PostgreSQLなどでDBを作る。
`schema.sql`を適用。

## Phase 2 — データ移行
既存 `luka.json` を読み取り、
users → spaces → rooms → messages ...
の順で投入。

既存IDをできるだけそのまま使う。
これが「今までのアカウントを引き継ぐ」ための重要ポイント。

## Phase 3 — 切り替え
DB版APIを有効化。
旧JSONは即削除せず、バックアップとして保管。

## Phase 4 — 安全確認
- ログイン
- 既存ユーザー
- スペース
- ルーム
- メッセージ
- DM
- 通知
- 通報
- 管理者権限
を確認。

## Phase 5 — 本番
バックアップと復旧手順を確認してから正式運用。
