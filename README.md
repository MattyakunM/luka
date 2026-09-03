# Luka V5.2 統合版

## 今回の統合
- Luka公式AIのサーバー接続
- Luka管理者AI（管理者「そら」専用UI）
- Luka Update（投稿UIは管理者のみ）
- AI接続状態確認
- 既存のV5チャット/DM/スペース/管理機能を維持

## Render
Environment Variables:
- `OPENAI_API_KEY` = OpenAI API key
- `LUKA_AI_MODEL` = `gpt-5-mini`（任意）

API:
- `/api/luka-ai/status`
- `/api/luka-admin-ai`

重要:
- APIキーはGitHubやフロントエンドコードに書かない。
- V5.2の管理者UI制御はクライアント側。公開運用前にはDBセッションによるサーバー側admin認証が必要。


## Luka V6.0 Ultimate Base
追加:
- Luka公式テーマ準備
- Supabase接続準備
- 端末セキュリティ基盤
- Botシステム基盤
- ロール/権限拡張準備
- スマホ表示改善

Render環境変数:
- SUPABASE_URL
- SUPABASE_KEY


## Luka V6.1 Integration Preparation
追加:
- Luka Design System 基盤
- アイコン管理構造
- 通話ステータス設計
- 表示名/ユーザーネーム設計
- Community/Role拡張準備



# Luka V6.2 Ultimate Integration
今回の統合版で、実際に使えるローカル機能を追加しました。

- Display Name / Username / Status
- Luka Community Hub（公開スペース検索・参加）
- スペースごとの自由ロール作成
- Bot Center（Read / Poll / Reminder / Guard / AI の追加・削除基盤）
- Security Center とブラウザ端末ID
- Luka公式アイコンSVGスターター
- Supabase移行用 schema_v6.sql

重要:
- 現在の1端末1アカウント判定はブラウザ識別子を使うローカル版です。Cookie/localStorage削除や別ブラウザ・別端末を完全に防ぐ仕組みではありません。
- 本番公開時はSupabase側でdevice_bindingsをサーバー権限で管理し、認証と組み合わせて強制してください。
- Community Hubは現在のサーバーJSON/local stateを使う統合版です。本番ではDB検索に移行します。
- Bot CenterはBotの追加・削除・設定を実際に保存できます。各Botの高度な外部連携は次段階で実装します。


## V7.0
Server-side message API, Socket.IO broadcasts, notifications, and a client realtime bridge were added on top of V6.2.


## V9 DB
Supabase DB adapter and social/DM migration are included. See `V9_DB_IMPLEMENTATION.md` and `schema_v9.sql`.
