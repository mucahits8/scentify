create table if not exists public.daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  perfume_id uuid not null references public.perfumes(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  reason text not null,
  weather_temp numeric(4,1),
  weather_condition text,
  recommended_date date not null default current_date,
  is_top_pick boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, perfume_id, recommended_date)
);

create index if not exists idx_daily_recommendations_user_id on public.daily_recommendations (user_id);
create index if not exists idx_daily_recommendations_recommended_date on public.daily_recommendations (recommended_date);
create index if not exists idx_daily_recommendations_top_pick on public.daily_recommendations (user_id, recommended_date, is_top_pick);

alter table public.daily_recommendations enable row level security;

drop policy if exists "daily_recommendations_select_own_row" on public.daily_recommendations;
create policy "daily_recommendations_select_own_row"
  on public.daily_recommendations
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.daily_recommendations to authenticated;
