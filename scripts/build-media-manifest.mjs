import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const outPath = process.argv[2] || "assets/media-manifest.json";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchAll(table, columns, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, to);
    if (error) throw error;
    const chunk = data || [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return rows;
}

const perfumeRows = await fetchAll(
  "perfumes",
  "id,slug,name,brand,brand_slug,country,image_url,source_url,perfumers",
);

const brandRows = await fetchAll(
  "brands",
  "slug,name,country,image_url,hero_image_url,tagline",
);

const perfumerRows = await fetchAll(
  "perfumers",
  "slug,name,portrait_url,city,country,quote",
);

const perfumes = (perfumeRows || []).map((row) => ({
  id: row.id,
  slug: row.slug || slugify(`${row.brand}-${row.name}`),
  name: row.name,
  brand: row.brand,
  brandSlug: row.brand_slug || slugify(row.brand),
  country: row.country || null,
  imageUrl: row.image_url || null,
  sourceUrl: row.source_url || null,
  searchQuery: `${row.brand} ${row.name} perfume bottle`,
  needsImage: !row.image_url,
}));

const brandsMap = new Map();
const perfumersMap = new Map();

for (const perfume of perfumes) {
  if (!brandsMap.has(perfume.brandSlug)) {
    brandsMap.set(perfume.brandSlug, {
      slug: perfume.brandSlug,
      name: perfume.brand,
      country: perfume.country,
      imageUrl: null,
      heroImageUrl: null,
      tagline: null,
      searchQuery: `${perfume.brand} perfume house`,
      needsImage: true,
    });
  }
}

for (const row of perfumeRows || []) {
  const perfumers = Array.isArray(row.perfumers) ? row.perfumers : [];
  for (const perfumer of perfumers) {
    const slug = slugify(perfumer);
    if (!perfumersMap.has(slug)) {
      perfumersMap.set(slug, {
        slug,
        name: perfumer,
        portraitUrl: null,
        city: null,
        country: null,
        quote: null,
        searchQuery: `${perfumer} perfumer portrait`,
        needsImage: true,
      });
    }
  }
}

for (const row of brandRows || []) {
  const existing = brandsMap.get(row.slug) || {
    slug: row.slug,
    name: row.name,
    country: row.country || null,
    searchQuery: `${row.name} perfume house`,
  };
  brandsMap.set(row.slug, {
    ...existing,
    imageUrl: row.image_url || null,
    heroImageUrl: row.hero_image_url || null,
    tagline: row.tagline || null,
    needsImage: !row.image_url && !row.hero_image_url,
  });
}

for (const row of perfumerRows || []) {
  const existing = perfumersMap.get(row.slug) || {
    slug: row.slug,
    name: row.name,
    searchQuery: `${row.name} perfumer portrait`,
  };
  perfumersMap.set(row.slug, {
    ...existing,
    portraitUrl: row.portrait_url || null,
    city: row.city || null,
    country: row.country || null,
    quote: row.quote || null,
    needsImage: !row.portrait_url,
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  counts: {
    perfumes: perfumes.length,
    perfumesNeedingImage: perfumes.filter((item) => item.needsImage).length,
    brands: brandsMap.size,
    brandsNeedingImage: [...brandsMap.values()].filter((item) => item.needsImage).length,
    perfumers: perfumersMap.size,
    perfumersNeedingImage: [...perfumersMap.values()].filter((item) => item.needsImage).length,
  },
  perfumes,
  brands: [...brandsMap.values()],
  perfumers: [...perfumersMap.values()],
};

const absoluteOutPath = path.resolve(outPath);
fs.mkdirSync(path.dirname(absoluteOutPath), { recursive: true });
fs.writeFileSync(absoluteOutPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Media manifest written to ${absoluteOutPath}`);
