create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('review', 'sotd', 'layering')),
  perfume_id uuid references public.perfumes(id) on delete set null,
  caption text not null check (length(btrim(caption)) > 0),
  visibility text not null default 'public' check (visibility in ('public', 'friends')),
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_comments_parent_same_post check (parent_id is null or post_id is not null)
);

create index if not exists idx_community_posts_created_at on public.community_posts (created_at desc);
create index if not exists idx_community_posts_user_id on public.community_posts (user_id);
create index if not exists idx_community_posts_perfume_id on public.community_posts (perfume_id);
create index if not exists idx_community_comments_post_id on public.community_comments (post_id, created_at desc);
create index if not exists idx_community_comments_user_id on public.community_comments (user_id);
create index if not exists idx_community_comments_parent_id on public.community_comments (parent_id);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
before update on public.community_posts
for each row execute function public.set_updated_at();

drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
before update on public.community_comments
for each row execute function public.set_updated_at();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
      set comment_count = (
        select count(*)::int from public.community_comments c where c.post_id = new.post_id
      ),
      updated_at = now()
      where id = new.post_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.community_posts
      set comment_count = (
        select count(*)::int from public.community_comments c where c.post_id = old.post_id
      ),
      updated_at = now()
      where id = old.post_id;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.post_id <> new.post_id then
      update public.community_posts
        set comment_count = (
          select count(*)::int from public.community_comments c where c.post_id = old.post_id
        ),
        updated_at = now()
        where id = old.post_id;
    end if;

    update public.community_posts
      set comment_count = (
        select count(*)::int from public.community_comments c where c.post_id = new.post_id
      ),
      updated_at = now()
      where id = new.post_id;

    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists community_comments_sync_count on public.community_comments;
create trigger community_comments_sync_count
after insert or update of post_id or delete on public.community_comments
for each row execute function public.sync_post_comment_count();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "community_posts_read_public_or_owner" on public.community_posts;
create policy "community_posts_read_public_or_owner"
  on public.community_posts
  for select
  to anon, authenticated
  using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "community_posts_insert_own_row" on public.community_posts;
create policy "community_posts_insert_own_row"
  on public.community_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "community_posts_update_own_row" on public.community_posts;
create policy "community_posts_update_own_row"
  on public.community_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "community_posts_delete_own_row" on public.community_posts;
create policy "community_posts_delete_own_row"
  on public.community_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "community_comments_read_visible_posts" on public.community_comments;
create policy "community_comments_read_visible_posts"
  on public.community_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = post_id
        and (p.visibility = 'public' or p.user_id = auth.uid())
    )
  );

drop policy if exists "community_comments_insert_own_row" on public.community_comments;
create policy "community_comments_insert_own_row"
  on public.community_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.community_posts p
      where p.id = post_id
        and (p.visibility = 'public' or p.user_id = auth.uid())
    )
  );

drop policy if exists "community_comments_update_own_row" on public.community_comments;
create policy "community_comments_update_own_row"
  on public.community_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "community_comments_delete_own_row" on public.community_comments;
create policy "community_comments_delete_own_row"
  on public.community_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.community_posts to anon, authenticated;
grant select on table public.community_comments to anon, authenticated;
grant insert, update, delete on table public.community_posts to authenticated;
grant insert, update, delete on table public.community_comments to authenticated;
