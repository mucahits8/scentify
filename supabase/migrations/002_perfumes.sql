create table if not exists public.perfumes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  image_url text,
  gender text check (gender in ('men', 'women', 'unisex')),
  year integer,
  concentration text,
  top_notes jsonb not null default '[]'::jsonb,
  mid_notes jsonb not null default '[]'::jsonb,
  base_notes jsonb not null default '[]'::jsonb,
  families jsonb not null default '[]'::jsonb,
  longevity numeric(3,1) not null default 0,
  projection numeric(3,1) not null default 0,
  seasons jsonb not null default '[]'::jsonb,
  occasions jsonb not null default '[]'::jsonb,
  impressions jsonb not null default '[]'::jsonb,
  price_range text check (price_range in ('$', '$$', '$$$', '$$$$')),
  scent_vector jsonb not null default '[0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::jsonb,
  rating_avg numeric(2,1) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint perfumes_scent_vector_length check (jsonb_typeof(scent_vector) = 'array' and jsonb_array_length(scent_vector) = 14)
);

create index if not exists idx_perfumes_brand on public.perfumes (brand);
create index if not exists idx_perfumes_name_search on public.perfumes using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(brand, '')));
create index if not exists idx_perfumes_families on public.perfumes using gin (families);
create index if not exists idx_perfumes_occasions on public.perfumes using gin (occasions);
create index if not exists idx_perfumes_impressions on public.perfumes using gin (impressions);

alter table public.perfumes enable row level security;

drop policy if exists "perfumes_public_read" on public.perfumes;
create policy "perfumes_public_read"
  on public.perfumes
  for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on table public.perfumes to anon, authenticated;

