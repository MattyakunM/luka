# Luka V11 — Complete Web Build

Luka is a browser-first communication workspace with a bilingual landing page and app.

## Included
- Japanese / English UI
- Supabase Auth (email/password)
- Profiles, usernames, status, avatars
- Public/private spaces, rooms, owner settings
- Realtime messages, replies, edit/delete, reactions
- Custom reaction image upload
- Space icon/banner upload
- Community Hub and join flow
- Friend requests and 1:1 DM data model
- Luka AI server endpoint
- Bot command helpers: `/help`, `/roll`, `/poll`, `/remind`, `/ai`
- WebRTC voice/video calling, mute, camera and screen-share controls
- Responsive tablet/mobile layout
- Official landing page with direct `/app/` navigation

## Render environment variables
- `SUPABASE_URL`
- `SUPABASE_KEY` (publishable/anon client key)
- `OPENAI_API_KEY` (optional, required for Luka AI)
- `LUKA_AI_MODEL` (optional, defaults to `gpt-5-mini`)

## Supabase
Run `supabase_schema_v11.sql` in the SQL editor of a fresh Supabase project before using DB features. The SQL creates all required tables, RLS policies, storage buckets and realtime publication entries.

## Local
```bash
npm install
npm start
```
Then open `http://localhost:3000/`.

Never put an OpenAI secret key in frontend code, the SQL file, or GitHub.
