-- Backfill remaining brand/perfumer placeholders using real catalog perfume bottle images.

with ranked_brand_images as (
  select
    b.id as brand_id,
    p.image_url,
    row_number() over (
      partition by b.id
      order by coalesce(p.rating_count, 0) desc, p.id
    ) as rn
  from brands b
  join perfumes p
    on (
      (p.brand_slug is not null and p.brand_slug = b.slug)
      or (p.brand_slug is null and lower(p.brand) = lower(b.name))
    )
  where
    p.image_url is not null
    and p.image_url not like '%dummyimage.com%'
),
brand_candidates as (
  select brand_id, image_url
  from ranked_brand_images
  where rn = 1
)
update brands b
set
  image_url = c.image_url,
  hero_image_url = c.image_url
from brand_candidates c
where
  b.id = c.brand_id
  and (
    b.image_url is null
    or b.hero_image_url is null
    or b.image_url like '%dummyimage.com%'
    or b.hero_image_url like '%dummyimage.com%'
  );

with ranked_perfumer_images as (
  select
    pf.id as perfumer_id,
    p.image_url,
    row_number() over (
      partition by pf.id
      order by coalesce(p.rating_count, 0) desc, p.id
    ) as rn
  from perfumers pf
  join perfumes p
    on exists (
      select 1
      from jsonb_array_elements_text(coalesce(p.perfumers, '[]'::jsonb)) perfumer_name
      where lower(perfumer_name) = lower(pf.name)
    )
  where
    p.image_url is not null
    and p.image_url not like '%dummyimage.com%'
),
perfumer_candidates as (
  select perfumer_id, image_url
  from ranked_perfumer_images
  where rn = 1
)
update perfumers pf
set portrait_url = c.image_url
from perfumer_candidates c
where
  pf.id = c.perfumer_id
  and (
    pf.portrait_url is null
    or pf.portrait_url like '%ui-avatars.com%'
  );
