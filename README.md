# Luka V11.0.1 — Verified Web Build

Luka is a browser-first communication workspace with a bilingual landing page and app.

## Included
- Japanese / English landing and app UI
- Supabase Auth (email/password)
- Profiles, usernames, status, avatars
- Public/private spaces and rooms
- Realtime message subscription
- Replies, edit/delete and reactions
- Custom reaction image upload
- Space icon/banner upload
- Community Hub and join flow
- Friend requests and 1:1 DM data model/UI
- Luka AI server endpoint
- Bot Center with real `space_bots` insertion and commands
- WebRTC voice/video calling, mute, camera and screen share
- Responsive tablet/mobile layout
- Explicit `/app`, `/app/`, `/app/index.html` routing

## Render environment variables
- `SUPABASE_URL`
- `SUPABASE_KEY` (publishable/anon client key)
- `OPENAI_API_KEY` (optional; required for Luka AI)
- `LUKA_AI_MODEL` (optional; defaults to `gpt-5-mini`)

## Supabase
Use `supabase_schema_v11.sql` in a fresh Supabase project. Do not mix it with the older Luka schema whose IDs used incompatible text/UUID types.

## Local
```bash
npm install
npm start
```
Open `http://localhost:3000/`.

Never put an OpenAI secret key in frontend code, SQL, or GitHub.

## Calling
The app includes browser WebRTC signaling over Supabase broadcast with a public STUN server. For reliable production calls across restrictive networks, configure a TURN service.
