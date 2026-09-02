-- Luka v3.9 database design
-- PostgreSQL / Supabase compatible base schema

create table if not exists users (
  id text primary key,
  username text not null unique,
  password_hash text not null,
  display_name text not null,
  avatar_url text default '',
  bio text default '',
  status_text text default '',
  account_type text not null default 'user',
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists spaces (
  id text primary key,
  name text not null,
  owner_id text references users(id),
  invite_code text unique,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists space_members (
  space_id text references spaces(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key(space_id,user_id)
);

create table if not exists rooms (
  id text primary key,
  space_id text references spaces(id) on delete cascade,
  name text not null,
  room_type text not null default 'text',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  author_id text references users(id),
  content text not null,
  reply_to_id text references messages(id),
  is_deleted boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_room_created on messages(room_id,created_at);

create table if not exists direct_threads (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists direct_members (
  thread_id text references direct_threads(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  primary key(thread_id,user_id)
);

create table if not exists direct_messages (
  id text primary key,
  thread_id text references direct_threads(id) on delete cascade,
  author_id text references users(id),
  content text not null,
  reply_to_id text references direct_messages(id),
  is_deleted boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_dm_created on direct_messages(thread_id,created_at);

create table if not exists reactions (
  id text primary key,
  message_id text references messages(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(message_id,user_id,emoji)
);

create table if not exists pins (
  message_id text primary key references messages(id) on delete cascade,
  pinned_by text references users(id),
  pinned_at timestamptz not null default now()
);

create table if not exists friendships (
  user_a text references users(id) on delete cascade,
  user_b text references users(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  primary key(user_a,user_b)
);

create table if not exists blocks (
  blocker_id text references users(id) on delete cascade,
  blocked_id text references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id)
);

create table if not exists notifications (
  id text primary key,
  user_id text references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text default '',
  related_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  reporter_id text references users(id),
  target_user_id text references users(id),
  target_message_id text references messages(id),
  reason text not null,
  status text not null default 'open',
  resolved_by text references users(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists files (
  id text primary key,
  uploader_id text references users(id),
  message_id text references messages(id) on delete set null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_key text not null,
  created_at timestamptz not null default now()
);

-- Official Luka identities.
-- account_type values:
-- user   = normal account
-- ai     = public Luka assistant
-- update = send-only update account
-- admin_ai = administrator/developer Luka

create table if not exists service_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into service_settings(key,value)
values
 ('service_name','Luka'),
 ('schema_version','3.9')
on conflict(key) do update set value=excluded.value, updated_at=now();
