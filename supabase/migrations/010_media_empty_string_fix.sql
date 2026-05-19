update public.perfumes
set image_url =
  'https://dummyimage.com/900x1200/2d2621/f1e6d6.png&text=' ||
  replace(
    replace(
      replace(
        left(coalesce(brand, 'Brand') || ' · ' || coalesce(name, 'Perfume'), 46),
        ' ',
        '%20'
      ),
      '&',
      '%26'
    ),
    '#',
    '%23'
  )
where coalesce(trim(image_url), '') = '';

update public.brands
set
  image_url = coalesce(nullif(trim(image_url), ''), 'https://dummyimage.com/1600x900/1f1a16/f1e6d6.png&text=' || replace(replace(replace(left(coalesce(name, 'Brand'), 30), ' ', '%20'), '&', '%26'), '#', '%23')),
  hero_image_url = coalesce(nullif(trim(hero_image_url), ''), 'https://dummyimage.com/1600x900/1f1a16/f1e6d6.png&text=' || replace(replace(replace(left(coalesce(name, 'Brand'), 30), ' ', '%20'), '&', '%26'), '#', '%23')),
  tagline = coalesce(nullif(trim(tagline), ''), 'A signature house with a distinctive olfactive language.')
where coalesce(trim(image_url), '') = ''
   or coalesce(trim(hero_image_url), '') = ''
   or coalesce(trim(tagline), '') = '';

update public.perfumers
set
  portrait_url = coalesce(nullif(trim(portrait_url), ''), 'https://ui-avatars.com/api/?size=512&background=cab18f&color=1a1714&bold=true&format=png&name=' || replace(replace(replace(left(coalesce(name, 'Perfumer'), 30), ' ', '+'), '&', '%26'), '#', '%23')),
  quote = coalesce(nullif(trim(quote), ''), 'A perfumer shaping modern fragrance with a personal signature.')
where coalesce(trim(portrait_url), '') = ''
   or coalesce(trim(quote), '') = '';
