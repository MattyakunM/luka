# Luka V11 verification

Verified locally before packaging:
- server.js: Node syntax check passed
- app/app.js: Node syntax check passed
- landing page exists
- app page exists
- explicit `/app`, `/app/`, and `/app/index.html` routes are registered before static middleware
- API health/config/db/AI/download routes are present
- Supabase schema is included
- source download bundle is included
- ZIP integrity check passed after packaging

Important production setup:
1. Use a fresh Supabase project, or migrate old Luka tables to the V11 UUID schema.
2. Set `SUPABASE_URL` and either `SUPABASE_ANON_KEY` (preferred) or `SUPABASE_KEY` to a publishable/anon key.
3. Never put a `service_role` key into either variable. V11 detects and refuses to expose service-role keys to the browser.
4. Set `OPENAI_API_KEY` only on Render/server if Luka AI is wanted.
5. Run `supabase_schema_v11.sql` before using database features.
