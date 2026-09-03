# Luka V9 — DB Integrated

V8 is included and this release adds a Supabase-backed database adapter with a JSON development fallback.

## Included
- V8 account / friend / DM APIs retained
- Supabase state loader for profiles, spaces, members, roles, messages, bots and device bindings
- DB status endpoint
- DB state endpoint
- Profile upsert endpoint
- V9 SQL migration for friend requests, friendships, DM channels, members and DM messages
- Useful indexes
- RLS enabled on social/DM tables as a security baseline
- Client `LukaDB` helper

## Setup
Set `SUPABASE_URL` and `SUPABASE_KEY` on the server (never in frontend code).
Run `schema_v9.sql` in Supabase before switching production traffic to DB mode.

## Still required before public production
- Supabase Auth / secure sessions
- RLS policies tailored to the final authorization model
- rate limiting and abuse protection
- server-side authorization on every mutation
- WebRTC signaling/media layer
- real bot execution
