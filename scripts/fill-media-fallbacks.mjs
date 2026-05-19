import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function shortText(value, max = 28) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function perfumeFallback(name, brand) {
  const text = encodeURIComponent(`${shortText(brand, 14)} · ${shortText(name, 22)}`);
  return `https://dummyimage.com/900x1200/2d2621/f1e6d6.png&text=${text}`;
}

function brandFallback(name) {
  const text = encodeURIComponent(shortText(name, 22));
  return `https://dummyimage.com/1600x900/1f1a16/f1e6d6.png&text=${text}`;
}

function perfumerFallback(name) {
  const safe = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${safe}&size=512&background=cab18f&color=1a1714&bold=true&format=png`;
}

async function fetchAll(table, columns, filter) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from(table).select(columns).range(from, from + 999);
    query = filter(query);
    const { data, error } = await query;
    if (error) throw error;
    const chunk = data || [];
    rows.push(...chunk);
    if (chunk.length < 1000) break;
  }
  return rows;
}

async function fillPerfumes() {
  const rows = await fetchAll("perfumes", "id,name,brand,image_url", (q) => q.is("image_url", null));
  const payload = rows.map((row) => ({
    id: row.id,
    image_url: perfumeFallback(row.name, row.brand),
  }));
  let updated = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await supabase.from("perfumes").upsert(chunk, { onConflict: "id" });
    if (!error) updated += chunk.length;
  }
  return { scanned: rows.length, updated };
}

async function fillBrands() {
  const rows = await fetchAll(
    "brands",
    "id,name,image_url,hero_image_url,tagline",
    (q) => q.or("image_url.is.null,hero_image_url.is.null"),
  );
  const payload = rows.map((row) => {
    const fallback = brandFallback(row.name);
    return {
      id: row.id,
      image_url: row.image_url ?? fallback,
      hero_image_url: row.hero_image_url ?? fallback,
      tagline: row.tagline ?? "A signature house with a distinctive olfactive language.",
    };
  });
  let updated = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await supabase.from("brands").upsert(chunk, { onConflict: "id" });
    if (!error) updated += chunk.length;
  }
  return { scanned: rows.length, updated };
}

async function fillPerfumers() {
  const rows = await fetchAll("perfumers", "id,name,portrait_url,quote", (q) => q.is("portrait_url", null));
  const payload = rows.map((row) => ({
    id: row.id,
    portrait_url: perfumerFallback(row.name),
    quote: row.quote ?? "A perfumer shaping modern fragrance with a personal signature.",
  }));
  let updated = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await supabase.from("perfumers").upsert(chunk, { onConflict: "id" });
    if (!error) updated += chunk.length;
  }
  return { scanned: rows.length, updated };
}

const perfumes = await fillPerfumes();
const brands = await fillBrands();
const perfumers = await fillPerfumers();

console.log(
  `Fallback fill done. perfumes ${perfumes.updated}/${perfumes.scanned}, brands ${brands.updated}/${brands.scanned}, perfumers ${perfumers.updated}/${perfumers.scanned}`,
);
