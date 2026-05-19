create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  perfume_id uuid not null references public.perfumes(id) on delete cascade,
  status text not null check (status in ('owned', 'wishlist', 'want_to_try', 'sampled')),
  size text,
  purchase_date date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, perfume_id)
);

create index if not exists idx_collections_user_id on public.collections (user_id);
create index if not exists idx_collections_status on public.collections (status);
create index if not exists idx_collections_perfume_id on public.collections (perfume_id);

alter table public.collections enable row level security;

drop policy if exists "collections_select_own_row" on public.collections;
create policy "collections_select_own_row"
  on public.collections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "collections_insert_own_row" on public.collections;
create policy "collections_insert_own_row"
  on public.collections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "collections_update_own_row" on public.collections;
create policy "collections_update_own_row"
  on public.collections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own_row" on public.collections;
create policy "collections_delete_own_row"
  on public.collections
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.collections to authenticated;

