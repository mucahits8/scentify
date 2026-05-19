alter table public.brands
  add column if not exists image_url text,
  add column if not exists hero_image_url text,
  add column if not exists tagline text;

create table if not exists public.perfumers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  portrait_url text,
  city text,
  country text,
  quote text,
  perfume_count integer not null default 0,
  signature_families jsonb not null default '[]'::jsonb,
  brands jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_perfumers_slug on public.perfumers (slug);
create index if not exists idx_perfumers_name_search on public.perfumers using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_perfumers_count on public.perfumers (perfume_count);

drop trigger if exists perfumers_set_updated_at on public.perfumers;
create trigger perfumers_set_updated_at
before update on public.perfumers
for each row execute function public.set_updated_at();

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

alter table public.perfumers enable row level security;

drop policy if exists "perfumers_public_read" on public.perfumers;
create policy "perfumers_public_read"
  on public.perfumers
  for select
  to anon, authenticated
  using (true);

grant select on table public.perfumers to anon, authenticated;
