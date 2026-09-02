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
