# Luka Web v3.0 Foundation

LukaをWebサービスとして育てるための最初の土台です。

## 今回
- PC / iPad / スマホ対応の基本UI
- 登録 / ログイン
- bcryptパスワードハッシュ
- 旧SHA-256の初回ログイン時アップグレード
- JWTセッション
- スペース / 招待コード / 部屋
- リアルタイムメッセージ
- 編集 / 削除
- 管理者権限・通報API
- PostgreSQL/Supabase向けschema.sql

## 起動
npm install
npm start

本番ではJWT_SECRETを必ず長いランダム値に変更してください。

## 重要
この版は「Web化＋DB移行の土台」です。現時点のJSON保存を本番DBとして使う完成版ではありません。
次にPostgreSQL/Supabaseへ接続し、DM、フレンド、通知、リアクション、検索、ファイル保存、公式AI、管理画面、WebRTC、セキュリティ強化を追加します。
