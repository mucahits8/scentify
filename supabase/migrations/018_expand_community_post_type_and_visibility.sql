alter table public.community_posts
  drop constraint if exists community_posts_type_check;

alter table public.community_posts
  add constraint community_posts_type_check
  check (
    type in (
      'fotd',
      'new_bottle',
      'review',
      'question',
      'layering',
      'comparison',
      'worth_it',
      'sotd'
    )
  );

alter table public.community_posts
  drop constraint if exists community_posts_visibility_check;

alter table public.community_posts
  add constraint community_posts_visibility_check
  check (
    visibility in ('public', 'friends', 'followers', 'private')
  );
