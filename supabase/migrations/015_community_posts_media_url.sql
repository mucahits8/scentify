alter table public.community_posts
  add column if not exists media_url text;
