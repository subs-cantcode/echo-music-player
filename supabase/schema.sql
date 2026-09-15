-- Echo Music Player — Supabase schema
-- Run this in the Supabase SQL editor after creating the project.
-- Then create a private Storage bucket named `audio-files` (or run the
-- insert at the bottom) and apply the storage policies.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  storage_bytes_used bigint not null default 0,
  storage_limit_bytes bigint not null default 1073741824,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  artist text,
  file_path text not null,
  duration_seconds numeric,
  file_size_bytes bigint not null default 0,
  original_name text,
  mime_type text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null default 0,
  primary key (playlist_id, track_id)
);

create index if not exists tracks_user_id_idx on public.tracks (user_id);
create index if not exists playlists_user_id_idx on public.playlists (user_id);
create index if not exists playlist_tracks_track_id_idx on public.playlist_tracks (track_id);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (id = auth.uid());

drop policy if exists "tracks_select_own" on public.tracks;
create policy "tracks_select_own"
  on public.tracks for select
  using (user_id = auth.uid());

drop policy if exists "tracks_insert_own" on public.tracks;
create policy "tracks_insert_own"
  on public.tracks for insert
  with check (user_id = auth.uid());

drop policy if exists "tracks_update_own" on public.tracks;
create policy "tracks_update_own"
  on public.tracks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tracks_delete_own" on public.tracks;
create policy "tracks_delete_own"
  on public.tracks for delete
  using (user_id = auth.uid());

drop policy if exists "playlists_select_own" on public.playlists;
create policy "playlists_select_own"
  on public.playlists for select
  using (user_id = auth.uid());

drop policy if exists "playlists_insert_own" on public.playlists;
create policy "playlists_insert_own"
  on public.playlists for insert
  with check (user_id = auth.uid());

drop policy if exists "playlists_update_own" on public.playlists;
create policy "playlists_update_own"
  on public.playlists for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "playlists_delete_own" on public.playlists;
create policy "playlists_delete_own"
  on public.playlists for delete
  using (user_id = auth.uid());

drop policy if exists "playlist_tracks_select_own" on public.playlist_tracks;
create policy "playlist_tracks_select_own"
  on public.playlist_tracks for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks_insert_own" on public.playlist_tracks;
create policy "playlist_tracks_insert_own"
  on public.playlist_tracks for insert
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tracks t
      where t.id = track_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks_update_own" on public.playlist_tracks;
create policy "playlist_tracks_update_own"
  on public.playlist_tracks for update
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tracks t
      where t.id = track_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks_delete_own" on public.playlist_tracks;
create policy "playlist_tracks_delete_own"
  on public.playlist_tracks for delete
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.adjust_storage_bytes(delta bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total bigint;
begin
  insert into public.profiles (id)
  values (auth.uid())
  on conflict (id) do nothing;

  update public.profiles
  set storage_bytes_used = greatest(0, storage_bytes_used + coalesce(delta, 0))
  where id = auth.uid()
  returning storage_bytes_used into new_total;

  return coalesce(new_total, 0);
end;
$$;

revoke all on function public.adjust_storage_bytes(bigint) from public;
grant execute on function public.adjust_storage_bytes(bigint) to authenticated;

create or replace function public.delete_own_account_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.tracks where user_id = auth.uid();
  delete from public.playlists where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account_data() from public;
grant execute on function public.delete_own_account_data() to authenticated;

create or replace function public.username_taken(check_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(check_name))
  );
$$;

revoke all on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('audio-files', 'audio-files', false)
on conflict (id) do nothing;

drop policy if exists "audio_files_select_own" on storage.objects;
create policy "audio_files_select_own"
  on storage.objects for select
  using (
    bucket_id = 'audio-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "audio_files_insert_own" on storage.objects;
create policy "audio_files_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'audio-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "audio_files_update_own" on storage.objects;
create policy "audio_files_update_own"
  on storage.objects for update
  using (
    bucket_id = 'audio-files'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'audio-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "audio_files_delete_own" on storage.objects;
create policy "audio_files_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'audio-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );
