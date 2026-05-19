import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from("perfumes")
    .select("brand,country,families,perfumers")
    .range(from, from + 999);
  if (error) throw error;
  const chunk = data || [];
  rows.push(...chunk);
  if (chunk.length < 1000) break;
}

const byPerfumer = new Map();

for (const row of rows || []) {
  const perfumers = Array.isArray(row.perfumers) ? row.perfumers : [];
  const families = Array.isArray(row.families) ? row.families : [];
  for (const name of perfumers) {
    const slug = slugify(name);
    const current = byPerfumer.get(slug) || {
      slug,
      name,
      city: null,
      country: row.country || null,
      quote: null,
      perfume_count: 0,
      signature_families: [],
      brands: [],
    };
    current.perfume_count += 1;
    current.signature_families = [...new Set([...current.signature_families, ...families])].slice(0, 6);
    current.brands = [...new Set([...current.brands, row.brand])].slice(0, 10);
    byPerfumer.set(slug, current);
  }
}

const payload = [...byPerfumer.values()];
if (!payload.length) {
  console.log("No perfumer payload generated.");
  process.exit(0);
}

const { error: upsertError } = await supabase
  .from("perfumers")
  .upsert(payload, { onConflict: "slug" });

if (upsertError) throw upsertError;

console.log(`Synced ${payload.length} perfumers from perfumes.`);
