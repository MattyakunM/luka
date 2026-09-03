-- Luka V6.2 starter schema
create table if not exists profiles (
  id text primary key,
  username text unique not null,
  display_name text not null,
  bio text default '',
  status text default 'online',
  created_at timestamptz default now()
);
create table if not exists spaces (
  id text primary key,
  name text not null,
  owner_id text not null,
  visibility text not null default 'private',
  category text default 'その他',
  created_at timestamptz default now()
);
create table if not exists space_members (
  space_id text not null,
  user_id text not null,
  role_id text,
  primary key(space_id,user_id)
);
create table if not exists roles (
  id text primary key,
  space_id text not null,
  name text not null,
  color text,
  permissions jsonb default '[]'::jsonb
);
create table if not exists messages (
  id text primary key,
  space_id text,
  room_id text,
  author_id text not null,
  body text not null,
  created_at timestamptz default now(),
  edited_at timestamptz
);
create table if not exists bots (
  id text primary key,
  name text not null,
  description text not null,
  created_at timestamptz default now()
);
create table if not exists space_bots (
  space_id text not null,
  bot_id text not null,
  enabled boolean default true,
  primary key(space_id,bot_id)
);
create table if not exists device_bindings (
  device_id text primary key,
  user_id text not null,
  created_at timestamptz default now(),
  last_seen timestamptz default now(),
  blocked boolean default false
);
