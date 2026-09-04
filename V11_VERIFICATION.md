# Luka V11.0.1 Verification

This package was checked before delivery.

- Node syntax: `server.js`, `app.js`, `app/app.js` pass `node --check`.
- Landing page exists and links to `/app/`.
- Server explicitly handles `/app`, `/app/`, and `/app/index.html` before static middleware.
- App navigation includes Settings.
- Supabase schema uses UUID consistently for auth-linked IDs.
- Required tables for profiles, spaces, rooms, messages, reactions, friendships, DMs and bots are present.
- Nested web-source ZIP passes ZIP integrity testing.
- Bot Center Add buttons now write to `space_bots` in Supabase.

Important production note: browser WebRTC peer-to-peer calling is implemented with STUN. A TURN service is still required for reliable calls across restrictive NAT/firewall networks. No software-only test can guarantee that every real-world network will work.
