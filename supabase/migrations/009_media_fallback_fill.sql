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
where image_url is null;

update public.brands
set
  image_url = coalesce(
    image_url,
    'https://dummyimage.com/1600x900/1f1a16/f1e6d6.png&text=' ||
      replace(replace(replace(left(coalesce(name, 'Brand'), 30), ' ', '%20'), '&', '%26'), '#', '%23')
  ),
  hero_image_url = coalesce(
    hero_image_url,
    'https://dummyimage.com/1600x900/1f1a16/f1e6d6.png&text=' ||
      replace(replace(replace(left(coalesce(name, 'Brand'), 30), ' ', '%20'), '&', '%26'), '#', '%23')
  ),
  tagline = coalesce(tagline, 'A signature house with a distinctive olfactive language.')
where image_url is null or hero_image_url is null or tagline is null;

update public.perfumers
set
  portrait_url = coalesce(
    portrait_url,
    'https://ui-avatars.com/api/?size=512&background=cab18f&color=1a1714&bold=true&format=png&name=' ||
      replace(replace(replace(left(coalesce(name, 'Perfumer'), 30), ' ', '+'), '&', '%26'), '#', '%23')
  ),
  quote = coalesce(quote, 'A perfumer shaping modern fragrance with a personal signature.')
where portrait_url is null or quote is null;
