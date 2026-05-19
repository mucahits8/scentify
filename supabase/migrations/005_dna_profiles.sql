create table if not exists public.user_scent_dna (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  fresh integer not null default 0 check (fresh between 0 and 100),
  woody integer not null default 0 check (woody between 0 and 100),
  sweet integer not null default 0 check (sweet between 0 and 100),
  citrus integer not null default 0 check (citrus between 0 and 100),
  spicy integer not null default 0 check (spicy between 0 and 100),
  aquatic integer not null default 0 check (aquatic between 0 and 100),
  powdery integer not null default 0 check (powdery between 0 and 100),
  musky integer not null default 0 check (musky between 0 and 100),
  amber integer not null default 0 check (amber between 0 and 100),
  vanilla integer not null default 0 check (vanilla between 0 and 100),
  leather integer not null default 0 check (leather between 0 and 100),
  floral integer not null default 0 check (floral between 0 and 100),
  smoky integer not null default 0 check (smoky between 0 and 100),
  oriental integer not null default 0 check (oriental between 0 and 100),
  profile_tags jsonb not null default '[]'::jsonb,
  best_families jsonb not null default '[]'::jsonb,
  avoid_notes jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.user_perfume_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  perfume_id uuid not null references public.perfumes(id) on delete cascade,
  preference_type text not null check (preference_type in ('love', 'dislike', 'own')),
  created_at timestamptz not null default now(),
  unique (user_id, perfume_id, preference_type)
);

create table if not exists public.user_style_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  style text not null,
  is_avoid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, style, is_avoid)
);

create table if not exists public.user_context_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  context text not null,
  created_at timestamptz not null default now(),
  unique (user_id, context)
);

create index if not exists idx_user_scent_dna_user_id on public.user_scent_dna (user_id);
create index if not exists idx_user_perfume_preferences_user_id on public.user_perfume_preferences (user_id);
create index if not exists idx_user_perfume_preferences_perfume_id on public.user_perfume_preferences (perfume_id);
create index if not exists idx_user_style_preferences_user_id on public.user_style_preferences (user_id);
create index if not exists idx_user_context_preferences_user_id on public.user_context_preferences (user_id);

alter table public.user_scent_dna enable row level security;
alter table public.user_perfume_preferences enable row level security;
alter table public.user_style_preferences enable row level security;
alter table public.user_context_preferences enable row level security;

drop policy if exists "dna_select_own_row" on public.user_scent_dna;
create policy "dna_select_own_row"
  on public.user_scent_dna
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "dna_insert_own_row" on public.user_scent_dna;
create policy "dna_insert_own_row"
  on public.user_scent_dna
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "dna_update_own_row" on public.user_scent_dna;
create policy "dna_update_own_row"
  on public.user_scent_dna
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "dna_delete_own_row" on public.user_scent_dna;
create policy "dna_delete_own_row"
  on public.user_scent_dna
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "pref_select_own_row" on public.user_perfume_preferences;
create policy "pref_select_own_row"
  on public.user_perfume_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "pref_insert_own_row" on public.user_perfume_preferences;
create policy "pref_insert_own_row"
  on public.user_perfume_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "pref_update_own_row" on public.user_perfume_preferences;
create policy "pref_update_own_row"
  on public.user_perfume_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pref_delete_own_row" on public.user_perfume_preferences;
create policy "pref_delete_own_row"
  on public.user_perfume_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "style_select_own_row" on public.user_style_preferences;
create policy "style_select_own_row"
  on public.user_style_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "style_insert_own_row" on public.user_style_preferences;
create policy "style_insert_own_row"
  on public.user_style_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "style_update_own_row" on public.user_style_preferences;
create policy "style_update_own_row"
  on public.user_style_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "style_delete_own_row" on public.user_style_preferences;
create policy "style_delete_own_row"
  on public.user_style_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "context_select_own_row" on public.user_context_preferences;
create policy "context_select_own_row"
  on public.user_context_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "context_insert_own_row" on public.user_context_preferences;
create policy "context_insert_own_row"
  on public.user_context_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "context_update_own_row" on public.user_context_preferences;
create policy "context_update_own_row"
  on public.user_context_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "context_delete_own_row" on public.user_context_preferences;
create policy "context_delete_own_row"
  on public.user_context_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_scent_dna to authenticated;
grant select, insert, update, delete on table public.user_perfume_preferences to authenticated;
grant select, insert, update, delete on table public.user_style_preferences to authenticated;
grant select, insert, update, delete on table public.user_context_preferences to authenticated;

