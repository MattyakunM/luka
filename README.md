# Luka V5 サーバー化版

これはV4完全ローカル版を、**同じサーバー上の共有状態 + Socket.IOリアルタイム同期**へ移した最初のサーバー版です。

## できること
- PC / iPad / スマホから同じURLへアクセス
- 同じLukaデータを共有
- スペース、ルーム、メッセージ、DM、フレンド、通知、通報、管理画面などV4のUIを維持
- Socket.IOで状態更新を他の接続中ブラウザへ通知
- そらの管理者権限
- 通常アカウント作成・切替
- Luka公式のローカル簡易自動返信

## ローカル起動
Node.jsを入れたPCでこのフォルダを開き、

    npm install
    npm start

その後 `http://localhost:3000/` を開きます。

## Renderへ出す場合
1. このフォルダの中身をGitHubのLukaリポジトリの `main` に反映
2. RenderのWeb ServiceでBranchが `main` になっていることを確認
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Deploy

## 重要な注意
このV5は「サーバー化の第一段階」です。
現在の共有データは `server-data.json` に保存します。Renderの通常のローカルディスクは永続DBではないため、**本番運用の前にPostgreSQLへ移行する必要があります**。

また、現在は本格的なユーザー認証・パスワード・権限APIではなく、V4のアカウント切替を共有データ上で同期しています。
したがって、これは「動作確認用のサーバー版」であり、公開サービスとして安全に運用する完成版ではありません。

## 次
V5の動作確認後に、
- PostgreSQL / Supabase
- 本物のログイン・セッション
- bcrypt/Argon2等のパスワードハッシュ
- APIごとの権限チェック
- 永続ファイルストレージ
- Luka公式のAI API接続
- WebRTC + TURN
- rate limit / CSRF / セキュリティ強化
へ移行します。
