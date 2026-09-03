-- Luka V9 database migration
-- Run in Supabase SQL editor after the existing schema_v6.sql if you want production DB mode.

create extension if not exists pgcrypto;

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique(from_user_id,to_user_id)
);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_a,user_b),
  check(user_a <> user_b)
);

create table if not exists dm_channels (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists dm_channel_members (
  channel_id uuid not null references dm_channels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key(channel_id,user_id)
);

create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references dm_channels(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check(char_length(content) between 1 and 4000),
  reply_to uuid references dm_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists idx_friend_requests_to_status on friend_requests(to_user_id,status);
create index if not exists idx_friendships_a on friendships(user_a);
create index if not exists idx_friendships_b on friendships(user_b);
create index if not exists idx_dm_members_user on dm_channel_members(user_id);
create index if not exists idx_dm_messages_channel_time on dm_messages(channel_id,created_at);

-- Supabase Realtime can be enabled for these tables from the dashboard.
-- RLS should be enabled and policies should be added before public release.
alter table friend_requests enable row level security;
alter table friendships enable row level security;
alter table dm_channels enable row level security;
alter table dm_channel_members enable row level security;
alter table dm_messages enable row level security;
