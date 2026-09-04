# Luka V10 feature set

Implemented in this package:
- Official futuristic landing page
- Japanese / English language switch
- Browser app at `/app`
- Supabase Auth-compatible login/signup
- Profiles: display name, username, bio, avatar
- Supabase profile persistence
- Spaces and rooms
- Supabase message persistence
- Supabase Realtime subscription for messages
- Reactions
- Community Hub
- Luka AI server API
- Supabase Storage avatar support
- V10 SQL with UUID-based IDs, RLS and Realtime
- Source-bundle download endpoint
- Electron desktop wrapper source

Planned production modules (architecture-ready, not falsely marked complete):
- Friend requests and 1:1 DM
- Rich file/image upload and download
- Custom reaction management
- Space icons, banners and themes
- Roles and fine-grained permissions
- Luka official/update/admin account architecture
- Bot execution engine
- Voice/video WebRTC calling, screen share and speaking indicators
- Notifications, pins, search and moderation
- Windows signed installer / release hosting

The package deliberately does not claim a feature is production-complete until its backend,
security policy and client behavior are implemented and tested together.
