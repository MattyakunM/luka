-- Luka V10 coherent Supabase schema.
create extension if not exists pgcrypto;

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text default '',
  status text default 'online',
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.spaces(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_only boolean default false,
  icon_url text,
  banner_url text,
  created_at timestamptz default now()
);

create table if not exists public.space_members(
  space_id uuid references public.spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  primary key(space_id,user_id)
);

create table if not exists public.rooms(
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.messages(
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check(length(content)<=10000),
  edited boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.reactions(
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id,user_id,emoji)
);

create table if not exists public.custom_reactions(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.space_bots(
  space_id uuid references public.spaces(id) on delete cascade,
  bot_id text not null,
  enabled boolean default true,
  primary key(space_id,bot_id)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,username,display_name)
  values(
    new.id,
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),'[^a-zA-Z0-9_]','','g')) || '_' || substr(new.id::text,1,6),
    coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))
  ) on conflict(id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.custom_reactions enable row level security;
alter table public.space_bots enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists spaces_select on public.spaces;
create policy spaces_select on public.spaces for select to authenticated using (invite_only=false or owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=id and m.user_id=auth.uid()));
drop policy if exists spaces_insert on public.spaces;
create policy spaces_insert on public.spaces for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists spaces_update_owner on public.spaces;
create policy spaces_update_owner on public.spaces for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists members_select on public.space_members;
create policy members_select on public.space_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.spaces s where s.id=space_id and (s.invite_only=false or s.owner_id=auth.uid())));
drop policy if exists members_insert_self on public.space_members;
create policy members_insert_self on public.space_members for insert to authenticated with check(user_id=auth.uid());

drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms for select to authenticated using(exists(select 1 from public.spaces s where s.id=space_id and (s.invite_only=false or s.owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=s.id and m.user_id=auth.uid()))));
drop policy if exists rooms_insert on public.rooms;
create policy rooms_insert on public.rooms for insert to authenticated with check(exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid()));

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated using(exists(select 1 from public.rooms r join public.spaces s on s.id=r.space_id where r.id=room_id and (s.invite_only=false or s.owner_id=auth.uid() or exists(select 1 from public.space_members m where m.space_id=s.id and m.user_id=auth.uid()))));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check(user_id=auth.uid());

drop policy if exists reactions_all on public.reactions;
create policy reactions_all on public.reactions for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists custom_reactions_select on public.custom_reactions;
create policy custom_reactions_select on public.custom_reactions for select to authenticated using(true);
drop policy if exists custom_reactions_insert on public.custom_reactions;
create policy custom_reactions_insert on public.custom_reactions for insert to authenticated with check(creator_id=auth.uid());

drop policy if exists space_bots_select on public.space_bots;
create policy space_bots_select on public.space_bots for select to authenticated using(true);
drop policy if exists space_bots_owner on public.space_bots;
create policy space_bots_owner on public.space_bots for all to authenticated using(exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid())) with check(exists(select 1 from public.spaces s where s.id=space_id and s.owner_id=auth.uid()));

-- Storage buckets.
insert into storage.buckets(id,name,public) values('avatars','avatars',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('space-assets','space-assets',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('custom-reactions','custom-reactions',true) on conflict(id) do nothing;

drop policy if exists avatar_upload on storage.objects;
create policy avatar_upload on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists avatar_update on storage.objects;
create policy avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists avatar_public_read on storage.objects;
create policy avatar_public_read on storage.objects for select to public using(bucket_id='avatars');

-- Enable message realtime.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
