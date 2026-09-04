-- Luka V11 clean schema. Use this on a fresh Supabase project, or reset the Luka tables before running it.
create extension if not exists pgcrypto;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique not null,
 display_name text not null,
 bio text not null default '',
 status text not null default 'online' check(status in ('online','away','busy','invisible')),
 avatar_url text,
 created_at timestamptz not null default now()
);
create table if not exists public.spaces(
 id uuid primary key default gen_random_uuid(), name text not null check(length(name)<=80),
 owner_id uuid not null references auth.users(id) on delete cascade,
 invite_only boolean not null default false, icon_url text, banner_url text, created_at timestamptz not null default now()
);
create table if not exists public.space_members(
 space_id uuid references public.spaces(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 role text not null default 'member', created_at timestamptz not null default now(), primary key(space_id,user_id)
);
create table if not exists public.rooms(
 id uuid primary key default gen_random_uuid(), space_id uuid not null references public.spaces(id) on delete cascade,
 name text not null check(length(name)<=80), created_at timestamptz not null default now()
);
create table if not exists public.messages(
 id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 content text not null check(length(content)<=10000), edited boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.reactions(
 id uuid primary key default gen_random_uuid(), message_id uuid not null references public.messages(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, emoji text not null, created_at timestamptz not null default now(), unique(message_id,user_id,emoji)
);
create table if not exists public.custom_reactions(
 id uuid primary key default gen_random_uuid(), name text not null check(length(name)<=40), image_url text not null,
 creator_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now()
);
create table if not exists public.friendships(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 friend_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','blocked')),
 created_at timestamptz not null default now(), unique(user_id,friend_id), check(user_id<>friend_id)
);
create table if not exists public.dm_rooms(
 id uuid primary key default gen_random_uuid(), user1_id uuid not null references auth.users(id) on delete cascade,
 user2_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), check(user1_id<>user2_id)
);
create table if not exists public.dm_messages(
 id uuid primary key default gen_random_uuid(), dm_id uuid not null references public.dm_rooms(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade, content text not null check(length(content)<=10000), created_at timestamptz not null default now()
);
create table if not exists public.space_bots(
 space_id uuid references public.spaces(id) on delete cascade, bot_id text not null, enabled boolean not null default true, primary key(space_id,bot_id)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,username,display_name) values(new.id,
 lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),'[^a-zA-Z0-9_]','','g'))||'_'||substr(new.id::text,1,6),
 coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))) on conflict(id) do nothing;
 return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.custom_reactions enable row level security;
alter table public.friendships enable row level security;
alter table public.dm_rooms enable row level security;
alter table public.dm_messages enable row level security;
alter table public.space_bots enable row level security;

-- Profiles
 drop policy if exists profiles_select on public.profiles; create policy profiles_select on public.profiles for select to authenticated using(true);
 drop policy if exists profiles_update on public.profiles; create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
-- Spaces
 drop policy if exists spaces_select on public.spaces; create policy spaces_select on public.spaces for select to authenticated using(not invite_only or owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=id and m.user_id=auth.uid()));
 drop policy if exists spaces_insert on public.spaces; create policy spaces_insert on public.spaces for insert to authenticated with check(owner_id=auth.uid());
 drop policy if exists spaces_update on public.spaces; create policy spaces_update on public.spaces for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
 drop policy if exists spaces_delete on public.spaces; create policy spaces_delete on public.spaces for delete to authenticated using(owner_id=auth.uid());
-- Membership
 drop policy if exists members_select on public.space_members; create policy members_select on public.space_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.spaces s where s.id=space_id and (not s.invite_only or s.owner_id=auth.uid())));
 drop policy if exists members_insert on public.space_members; create policy members_insert on public.space_members for insert to authenticated with check(user_id=auth.uid());
 drop policy if exists members_delete on public.space_members; create policy members_delete on public.space_members for delete to authenticated using(user_id=auth.uid() or exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid()));
-- Rooms
 drop policy if exists rooms_select on public.rooms; create policy rooms_select on public.rooms for select to authenticated using(exists(select 1 from public.spaces s where s.id=space_id and (not s.invite_only or s.owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=s.id and m.user_id=auth.uid()))));
 drop policy if exists rooms_insert on public.rooms; create policy rooms_insert on public.rooms for insert to authenticated with check(exists(select 1 from public.spaces s where s.id=space_id and (s.owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=s.id and m.user_id=auth.uid()))));
 drop policy if exists rooms_delete on public.rooms; create policy rooms_delete on public.rooms for delete to authenticated using(exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid()));
-- Messages
 drop policy if exists messages_select on public.messages; create policy messages_select on public.messages for select to authenticated using(exists(select 1 from public.rooms r join public.spaces s on s.id=r.space_id where r.id=room_id and (not s.invite_only or s.owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=s.id and m.user_id=auth.uid()))));
 drop policy if exists messages_insert on public.messages; create policy messages_insert on public.messages for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.rooms r join public.spaces s on s.id=r.space_id where r.id=room_id and (not s.invite_only or s.owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=s.id and m.user_id=auth.uid()))));
 drop policy if exists messages_update on public.messages; create policy messages_update on public.messages for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 drop policy if exists messages_delete on public.messages; create policy messages_delete on public.messages for delete to authenticated using(user_id=auth.uid());
-- Reactions
 drop policy if exists reactions_select on public.reactions; create policy reactions_select on public.reactions for select to authenticated using(true);
 drop policy if exists reactions_insert on public.reactions; create policy reactions_insert on public.reactions for insert to authenticated with check(user_id=auth.uid());
 drop policy if exists reactions_delete on public.reactions; create policy reactions_delete on public.reactions for delete to authenticated using(user_id=auth.uid());
-- Custom reactions
 drop policy if exists custom_reactions_select on public.custom_reactions; create policy custom_reactions_select on public.custom_reactions for select to authenticated using(true);
 drop policy if exists custom_reactions_insert on public.custom_reactions; create policy custom_reactions_insert on public.custom_reactions for insert to authenticated with check(creator_id=auth.uid());
 drop policy if exists custom_reactions_delete on public.custom_reactions; create policy custom_reactions_delete on public.custom_reactions for delete to authenticated using(creator_id=auth.uid());
-- Friends
 drop policy if exists friends_select on public.friendships; create policy friends_select on public.friendships for select to authenticated using(user_id=auth.uid() or friend_id=auth.uid());
 drop policy if exists friends_insert on public.friendships; create policy friends_insert on public.friendships for insert to authenticated with check(user_id=auth.uid());
 drop policy if exists friends_update on public.friendships; create policy friends_update on public.friendships for update to authenticated using(user_id=auth.uid() or friend_id=auth.uid()) with check(user_id=auth.uid() or friend_id=auth.uid());
 drop policy if exists friends_delete on public.friendships; create policy friends_delete on public.friendships for delete to authenticated using(user_id=auth.uid() or friend_id=auth.uid());
-- DMs
 drop policy if exists dm_rooms_select on public.dm_rooms; create policy dm_rooms_select on public.dm_rooms for select to authenticated using(user1_id=auth.uid() or user2_id=auth.uid());
 drop policy if exists dm_rooms_insert on public.dm_rooms; create policy dm_rooms_insert on public.dm_rooms for insert to authenticated with check(user1_id=auth.uid() or user2_id=auth.uid());
 drop policy if exists dm_messages_select on public.dm_messages; create policy dm_messages_select on public.dm_messages for select to authenticated using(exists(select 1 from public.dm_rooms d where d.id=dm_id and (d.user1_id=auth.uid() or d.user2_id=auth.uid())));
 drop policy if exists dm_messages_insert on public.dm_messages; create policy dm_messages_insert on public.dm_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.dm_rooms d where d.id=dm_id and (d.user1_id=auth.uid() or d.user2_id=auth.uid())));
-- Bots
 drop policy if exists bots_select on public.space_bots; create policy bots_select on public.space_bots for select to authenticated using(true);
 drop policy if exists bots_manage on public.space_bots; create policy bots_manage on public.space_bots for all to authenticated using(exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid())) with check(exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid()));

-- Storage
insert into storage.buckets(id,name,public) values('avatars','avatars',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('space-assets','space-assets',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('custom-reactions','custom-reactions',true) on conflict(id) do nothing;
drop policy if exists avatar_read on storage.objects; create policy avatar_read on storage.objects for select to public using(bucket_id='avatars');
drop policy if exists avatar_write on storage.objects; create policy avatar_write on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists avatar_update on storage.objects; create policy avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists asset_read on storage.objects; create policy asset_read on storage.objects for select to public using(bucket_id in ('space-assets','custom-reactions'));
drop policy if exists asset_write on storage.objects; create policy asset_write on storage.objects for insert to authenticated with check(bucket_id in ('space-assets','custom-reactions') and (storage.foldername(name))[1]=auth.uid()::text);

-- Realtime
DO $$ BEGIN alter publication supabase_realtime add table public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN alter publication supabase_realtime add table public.reactions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
