create table if not exists public.user_public_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text not null default 'Scentify User',
  headline text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_public_profiles_set_updated_at on public.user_public_profiles;
create trigger user_public_profiles_set_updated_at
before update on public.user_public_profiles
for each row execute function public.set_updated_at();

create or replace function public.sync_user_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_public_profiles (user_id, display_name, avatar_url, bio, created_at, updated_at)
  values (
    new.id,
    coalesce(nullif(new.full_name, ''), nullif(new.username::text, ''), 'Scentify User'),
    nullif(new.avatar_url, ''),
    nullif(new.bio, ''),
    now(),
    now()
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        bio = excluded.bio,
        updated_at = now();

  return new;
end;
$$;

insert into public.user_public_profiles (user_id, display_name, avatar_url, bio)
select
  u.id,
  coalesce(nullif(u.full_name, ''), nullif(u.username::text, ''), 'Scentify User'),
  nullif(u.avatar_url, ''),
  nullif(u.bio, '')
from public.users u
on conflict (user_id) do update
  set display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      bio = excluded.bio,
      updated_at = now();

drop trigger if exists users_sync_public_profile on public.users;
create trigger users_sync_public_profile
after insert or update of full_name, username, avatar_url, bio
on public.users
for each row execute function public.sync_user_public_profile();

alter table public.user_public_profiles enable row level security;

drop policy if exists "public_profiles_read_all" on public.user_public_profiles;
create policy "public_profiles_read_all"
  on public.user_public_profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public_profiles_update_own_row" on public.user_public_profiles;
create policy "public_profiles_update_own_row"
  on public.user_public_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "public_profiles_insert_own_row" on public.user_public_profiles;
create policy "public_profiles_insert_own_row"
  on public.user_public_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select on table public.user_public_profiles to anon, authenticated;
grant insert, update on table public.user_public_profiles to authenticated;

create index if not exists idx_ratings_public_reviews_perfume_created
  on public.ratings (perfume_id, created_at desc)
  where review_text is not null;

drop policy if exists "ratings_public_reviews_read" on public.ratings;
create policy "ratings_public_reviews_read"
  on public.ratings
  for select
  to authenticated
  using (review_text is not null and length(btrim(review_text)) > 0);
