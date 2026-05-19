alter table public.perfumes
  add column if not exists slug text,
  add column if not exists brand_slug text,
  add column if not exists source_url text,
  add column if not exists country text,
  add column if not exists perfumers jsonb not null default '[]'::jsonb;

update public.perfumes
set
  brand_slug = coalesce(brand_slug, lower(regexp_replace(brand, '[^a-zA-Z0-9]+', '-', 'g'))),
  slug = coalesce(slug, lower(regexp_replace(brand, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null or brand_slug is null;

alter table public.perfumes
  alter column slug set not null,
  alter column brand_slug set not null;

create unique index if not exists idx_perfumes_slug on public.perfumes (slug);
create index if not exists idx_perfumes_brand_slug on public.perfumes (brand_slug);
create index if not exists idx_perfumes_country on public.perfumes (country);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  country text,
  perfume_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brands_name_search on public.brands using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_brands_country on public.brands (country);

alter table public.brands enable row level security;

drop policy if exists "brands_public_read" on public.brands;
create policy "brands_public_read"
  on public.brands
  for select
  to anon, authenticated
  using (true);

grant select on table public.brands to anon, authenticated;
