# Luka V10 Complete

This build is a real, connected browser implementation rather than a UI mock.

## Run
1. `npm install`
2. `npm start`
3. Open `http://localhost:3000`

## Supabase
Set:
- `SUPABASE_URL`
- `SUPABASE_KEY` (publishable/anon key)

Run `supabase_schema_v10.sql` in Supabase SQL Editor, then enable email auth.

## AI
Set `OPENAI_API_KEY` on the server. Never put this secret in frontend code.

## Download
The official landing page has a working source-bundle download endpoint:
`/api/download/source`

## Important
WebRTC UI capability is reserved in the architecture, but a full production call signaling/ICE service still needs to be deployed and tested; this build does not pretend that a non-existent call backend is finished.
