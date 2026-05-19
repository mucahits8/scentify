insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_media_public_read" on storage.objects;
create policy "community_media_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'community-media');

drop policy if exists "community_media_insert_own_folder" on storage.objects;
create policy "community_media_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "community_media_update_own_folder" on storage.objects;
create policy "community_media_update_own_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "community_media_delete_own_folder" on storage.objects;
create policy "community_media_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
