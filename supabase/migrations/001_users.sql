create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    username,
    full_name,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique not null,
  username citext unique,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  gender_preference text check (gender_preference in ('men', 'women', 'all')),
  budget_preference text check (budget_preference in ('affordable', 'mid', 'premium', 'luxury')),
  intensity_preference text check (intensity_preference in ('light', 'moderate', 'strong')),
  weather_enabled boolean not null default false,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;

drop policy if exists "users_select_own_row" on public.users;
create policy "users_select_own_row"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users_update_own_row" on public.users;
create policy "users_update_own_row"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users_delete_own_row" on public.users;
create policy "users_delete_own_row"
  on public.users
  for delete
  to authenticated
  using (auth.uid() = id);

grant usage on schema public to anon, authenticated;
grant select, update, delete on table public.users to authenticated;
