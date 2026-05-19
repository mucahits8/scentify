create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  perfume_id uuid not null references public.perfumes(id) on delete cascade,
  score numeric(2,1) not null check (score >= 0.5 and score <= 5),
  impression_tags jsonb not null default '[]'::jsonb,
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, perfume_id)
);

create index if not exists idx_ratings_user_id on public.ratings (user_id);
create index if not exists idx_ratings_perfume_id on public.ratings (perfume_id);
create index if not exists idx_ratings_score on public.ratings (score);

drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at
before update on public.ratings
for each row execute function public.set_updated_at();

alter table public.ratings enable row level security;

drop policy if exists "ratings_select_own_row" on public.ratings;
create policy "ratings_select_own_row"
  on public.ratings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ratings_insert_own_row" on public.ratings;
create policy "ratings_insert_own_row"
  on public.ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own_row" on public.ratings;
create policy "ratings_update_own_row"
  on public.ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ratings_delete_own_row" on public.ratings;
create policy "ratings_delete_own_row"
  on public.ratings
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.ratings to authenticated;
