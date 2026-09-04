# Luka V11 feature map

Implemented in this package: landing site, bilingual app UI, Supabase Auth, profiles, avatars, spaces, rooms, public/private discovery, realtime messages, edit/delete/reply, reactions, custom reaction uploads, space icon/banner customization, friend request data model, DM data model, Luka AI endpoint, bot command helpers, WebRTC calling with mute/camera/screen-share, responsive layout, health/config endpoints, source download endpoint.

Operational caveats: WebRTC reliability depends on browser permissions, NAT/firewall conditions and TURN availability. For public-scale calls, add a TURN service and stronger call access control. Supabase Auth email-confirmation behavior follows the project's Auth settings.
