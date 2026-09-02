# Luka V4 アカウント切り替え・置換版

## 置き換えるファイル
- `app.js` → GitHub の `main/app.js` と丸ごと置き換え

## 重要
- `luka.json` は触らない
- `server.js` は触らない
- `style.css` / `index.html` も今回は触らない
- 既存の `luka_v4_state` はそのまま利用する

## 仕様
- 「そら」が唯一の管理者
- 管理画面から一般アカウントを作成・切り替え
- プロフィール画面からも保存済みアカウントを切り替え可能
- 新規アカウントは管理者にならない
- V4のlocalStorage版なので、このブラウザ内での切り替え

## GitHub
1. main/app.js を開く
2. 「このファイルを編集」
3. 中身を全部削除
4. このZIPの `app.js` の中身を全部貼り付け
5. 「変更をコミット」
6. Renderのデプロイ完了後、Lukaを Ctrl + Shift + R で更新
