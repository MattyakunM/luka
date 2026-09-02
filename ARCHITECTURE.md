# Luka 本番構成の予定

                    ┌───────────────┐
                    │ Browser / iPad │
                    │ PC / Mobile   │
                    └───────┬───────┘
                            │ HTTPS
                    ┌───────▼───────┐
                    │ Luka Web/API  │
                    │ Express       │
                    │ Socket.IO     │
                    └───┬───────┬───┘
                        │       │
              ┌─────────▼─┐   ┌─▼────────────┐
              │ PostgreSQL │   │ Object       │
              │ / Supabase │   │ Storage      │
              └───────────┘   └──────────────┘

                 将来の通話:
                 WebRTC
                    │
              Signaling Server
                    │
                 TURN/SFU

## データの原則

コード更新とユーザーデータを分離する。

コード:
GitHub / Render

データ:
PostgreSQL / Object Storage

これにより、サイトを更新してもアカウントやメッセージを消さない。
