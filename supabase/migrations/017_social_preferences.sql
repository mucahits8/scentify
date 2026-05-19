create table if not exists public.user_social_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  is_private_profile boolean not null default false,
  hide_collection_from_public boolean not null default false,
  allow_comments boolean not null default true,
  allow_mentions boolean not null default true,
  show_activity_status boolean not null default true,
  push_social boolean not null default true,
  push_reminders boolean not null default true,
  push_wishlist boolean not null default true,
  push_price_drop boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_post_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id text not null,
  state text not null check (state in ('saved', 'archived')),
  created_at timestamptz not null default now(),
  unique (user_id, post_id, state)
);

create table if not exists public.user_blocked_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  blocked_name text not null,
  blocked_handle text not null,
  created_at timestamptz not null default now(),
  unique (user_id, blocked_handle)
);

create index if not exists idx_user_post_states_user_state on public.user_post_states (user_id, state, created_at desc);
create index if not exists idx_user_blocked_profiles_user on public.user_blocked_profiles (user_id, created_at desc);

drop trigger if exists user_social_preferences_set_updated_at on public.user_social_preferences;
create trigger user_social_preferences_set_updated_at
before update on public.user_social_preferences
for each row execute function public.set_updated_at();

alter table public.user_social_preferences enable row level security;
alter table public.user_post_states enable row level security;
alter table public.user_blocked_profiles enable row level security;

drop policy if exists "social_prefs_select_own_row" on public.user_social_preferences;
create policy "social_prefs_select_own_row"
  on public.user_social_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "social_prefs_insert_own_row" on public.user_social_preferences;
create policy "social_prefs_insert_own_row"
  on public.user_social_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "social_prefs_update_own_row" on public.user_social_preferences;
create policy "social_prefs_update_own_row"
  on public.user_social_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_prefs_delete_own_row" on public.user_social_preferences;
create policy "social_prefs_delete_own_row"
  on public.user_social_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_post_states_select_own_rows" on public.user_post_states;
create policy "user_post_states_select_own_rows"
  on public.user_post_states
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_post_states_insert_own_rows" on public.user_post_states;
create policy "user_post_states_insert_own_rows"
  on public.user_post_states
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_post_states_update_own_rows" on public.user_post_states;
create policy "user_post_states_update_own_rows"
  on public.user_post_states
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_post_states_delete_own_rows" on public.user_post_states;
create policy "user_post_states_delete_own_rows"
  on public.user_post_states
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_blocked_profiles_select_own_rows" on public.user_blocked_profiles;
create policy "user_blocked_profiles_select_own_rows"
  on public.user_blocked_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_blocked_profiles_insert_own_rows" on public.user_blocked_profiles;
create policy "user_blocked_profiles_insert_own_rows"
  on public.user_blocked_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_blocked_profiles_update_own_rows" on public.user_blocked_profiles;
create policy "user_blocked_profiles_update_own_rows"
  on public.user_blocked_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_blocked_profiles_delete_own_rows" on public.user_blocked_profiles;
create policy "user_blocked_profiles_delete_own_rows"
  on public.user_blocked_profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_social_preferences to authenticated;
grant select, insert, update, delete on table public.user_post_states to authenticated;
grant select, insert, update, delete on table public.user_blocked_profiles to authenticated;
