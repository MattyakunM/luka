# Luka V5.1.1 — AI + Luka Update

## 重要
- `Luka公式` は `/api/luka-ai` を使う本物のAI接続です。Render側で `OPENAI_API_KEY` が設定されていないとAIは動きません。
- APIキーは `app.js` やGitHubに書かず、Renderの「環境変数」に設定してください。
- `LUKA_AI_MODEL` は任意。未設定なら `gpt-5-mini` を使用します。

## Render
1. GitHubの `main` にこのZIPのファイルを配置・置換。
2. Renderが `main` をデプロイすることを確認。
3. Render → Luka → Environment に `OPENAI_API_KEY` を追加。
4. 保存して再デプロイ。
5. `/api/luka-ai/status` で `configured:true` を確認。

## Luka Update
`Luka Update` は配信用アカウントです。通常ユーザーは書き込めません。管理者「そら」だけが管理画面の「Luka Updateを投稿」から更新情報を投稿できます。

## データ
`server-data.json` はサーバー起動時に自動生成される実データです。GitHubへコミットしないでください。初期データは `luka.json` です。
