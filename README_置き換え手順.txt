【Luka V4 アカウント切替・検証済み版】

このZIPは app.js の置き換え用です。

変更内容
・「そら」が唯一の管理者
・管理画面から通常アカウントを作成
・管理画面からアカウント切替
・プロフィールからもアカウント切替
・通常アカウントには管理者権限なし
・既存V4の機能を維持
・既知のapp.js構文エラーを修正

置き換え方法
1. GitHubの main を開く
2. app.js をこのZIPの app.js に置き換える
3. server.js / index.html / style.css / luka.json は変更しない
4. Renderの再デプロイ後、ブラウザで Ctrl+Shift+R

※これはV4のlocalStorage版なので、アカウント情報はそのブラウザ内に保存されます。
