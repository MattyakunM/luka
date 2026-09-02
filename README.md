# Luka V5.1 — Luka公式 AI 組み込み版

V5サーバー版に、**サーバー側のOpenAI API接続**を追加した版です。

## 重要
AIを実際に動かすには、サーバー側に `OPENAI_API_KEY` を環境変数として設定する必要があります。
**app.jsへAPIキーを書かないでください。**

任意で `LUKA_AI_MODEL` を設定できます。未設定なら `gpt-5-mini` を使用します。
利用可能なモデル名は、利用しているOpenAI APIアカウントのモデル一覧に合わせて設定してください。

## Renderでの設定
RenderのLuka Web Service → Environment（環境変数）で、

- Key: `OPENAI_API_KEY`
- Value: OpenAI APIキー

を追加して保存し、再デプロイします。

必要なら、

- Key: `LUKA_AI_MODEL`
- Value: 利用するモデル名

も設定します。

APIキーはGitHubへコミットしないでください。

## 動作
ユーザーが「Luka公式」にDMを送る
→ `/api/luka-ai`
→ Lukaサーバー
→ OpenAI Responses API
→ Luka公式として返信

AI APIが未設定・一時的に失敗した場合は、既存のローカル簡易返信へフォールバックします。

## 現段階の注意
これはまだ本番公開の完成版ではありません。
認証・レート制限・DB・永続ファイル保存などは次段階で強化します。
AI利用にはAPI料金が発生する場合があるため、公開前に利用上限や安全対策を追加してください。
