import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Usage: npm run media:import -- ./path/to/media-mapping.json");
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
}

function parseDelimited(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const delimiter = lines[0]?.includes(";") ? ";" : ",";
  const headers = (lines[0] || "").split(delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((v) => v.trim());
    return Object.fromEntries(headers.map((header, idx) => [header, cells[idx] ?? ""]));
  });
}

function normalizeRows(rawData) {
  if (Array.isArray(rawData)) return rawData;
  const perfumes = Array.isArray(rawData.perfumes) ? rawData.perfumes.map((row) => ({ ...row, type: "perfume" })) : [];
  const brands = Array.isArray(rawData.brands) ? rawData.brands.map((row) => ({ ...row, type: "brand" })) : [];
  const perfumers = Array.isArray(rawData.perfumers) ? rawData.perfumers.map((row) => ({ ...row, type: "perfumer" })) : [];
  return [...perfumes, ...brands, ...perfumers];
}

const absolutePath = path.resolve(inputPath);
const raw = fs.readFileSync(absolutePath, "utf8");
const rows =
  absolutePath.endsWith(".json")
    ? normalizeRows(JSON.parse(raw))
    : parseDelimited(raw);

const perfumes = rows
  .filter((row) => String(row.type || "").toLowerCase() === "perfume")
  .map((row) => ({
    slug: row.slug,
    image_url: row.image_url || row.imageUrl || null,
    source_url: row.source_url || row.sourceUrl || null,
  }))
  .filter((row) => row.slug && row.image_url);

const brands = rows
  .filter((row) => String(row.type || "").toLowerCase() === "brand")
  .map((row) => ({
    slug: row.slug,
    image_url: row.image_url || row.imageUrl || null,
    hero_image_url: row.hero_image_url || row.heroImageUrl || null,
    tagline: row.tagline || null,
  }))
  .filter((row) => row.slug && (row.image_url || row.hero_image_url || row.tagline));

const perfumers = rows
  .filter((row) => String(row.type || "").toLowerCase() === "perfumer")
  .map((row) => ({
    slug: row.slug,
    portrait_url: row.portrait_url || row.portraitUrl || null,
    quote: row.quote || null,
    city: row.city || null,
    country: row.country || null,
  }))
  .filter((row) => row.slug && (row.portrait_url || row.quote || row.city || row.country));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let updatedPerfumes = 0;
let updatedBrands = 0;
let updatedPerfumers = 0;

for (const row of perfumes) {
  const { error } = await supabase
    .from("perfumes")
    .update({ image_url: row.image_url, source_url: row.source_url })
    .eq("slug", row.slug);
  if (error) throw error;
  updatedPerfumes += 1;
}

for (const row of brands) {
  const { error } = await supabase
    .from("brands")
    .update({
      image_url: row.image_url,
      hero_image_url: row.hero_image_url,
      tagline: row.tagline,
    })
    .eq("slug", row.slug);
  if (error) throw error;
  updatedBrands += 1;
}

for (const row of perfumers) {
  const { error } = await supabase
    .from("perfumers")
    .update({
      portrait_url: row.portrait_url,
      quote: row.quote,
      city: row.city,
      country: row.country,
    })
    .eq("slug", row.slug);
  if (error) throw error;
  updatedPerfumers += 1;
}

console.log(
  `Media import done. perfumes=${updatedPerfumes}, brands=${updatedBrands}, perfumers=${updatedPerfumers}`,
);
