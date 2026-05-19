update perfumes
set image_url = regexp_replace(
  image_url,
  'https://fimgs\.net/mdimg/perfume-social-cards/en-social-([0-9]+)\.jpeg',
  'https://fimgs.net/mdimg/perfume/375x500.\1.jpg'
)
where image_url like 'https://fimgs.net/mdimg/perfume-social-cards/%';
