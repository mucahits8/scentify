import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const csvPath = process.argv[2] || "/Users/mucahit/Desktop/fra_cleaned.csv";
const batchSize = Number(process.env.IMPORT_BATCH_SIZE || 500);
const dryRun = process.argv.includes("--dry-run");

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!fs.existsSync(csvPath)) {
  throw new Error(`CSV not found: ${csvPath}`);
}

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before importing.");
}

const accordMap = {
  fresh: "fresh",
  citrus: "citrus",
  woody: "woody",
  sweet: "sweet",
  spicy: "spicy",
  aquatic: "aquatic",
  marine: "aquatic",
  ozonic: "aquatic",
  powdery: "powdery",
  musky: "musky",
  amber: "amber",
  vanilla: "vanilla",
  leather: "leather",
  floral: "floral",
  smoky: "smoky",
  oriental: "oriental",
  aromatic: "fresh",
  warm_spicy: "spicy",
  fresh_spicy: "spicy",
  white_floral: "floral",
  yellow_floral: "floral",
  rose: "floral",
  fruity: "sweet",
  tropical: "sweet",
  balsamic: "amber",
  green: "fresh",
  soft_spicy: "spicy",
  earthy: "woody",
  patchouli: "oriental",
  cacao: "sweet",
  cinnamon: "spicy",
  lactonic: "vanilla",
  animalic: "musky",
  almond: "sweet",
  nutty: "sweet",
  mossy: "woody",
  iris: "powdery",
};

const scentDimensions = [
  "fresh",
  "woody",
  "sweet",
  "citrus",
  "spicy",
  "aquatic",
  "powdery",
  "musky",
  "amber",
  "vanilla",
  "leather",
  "floral",
  "smoky",
  "oriental",
];

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function titleizeSlug(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function splitCsvList(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item.toLowerCase() !== "unknown");
}

function normalizeAccord(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function buildVector(accords) {
  const scores = Object.fromEntries(scentDimensions.map((key) => [key, 0]));

  accords.forEach((accord, index) => {
    const mapped = accordMap[normalizeAccord(accord)];
    if (!mapped) return;
    const weight = Math.max(20, 100 - index * 15);
    scores[mapped] = Math.min(100, scores[mapped] + weight);
  });

  return scentDimensions.map((key) => scores[key]);
}

function parseRows(raw) {
  const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
  const headers = headerLine
    .split(";")
    .map((header) => header.replace(/^\uFEFF/, "").trim());

  return lines.map((line) => {
    const parts = line.split(";");
    return Object.fromEntries(headers.map((key, index) => [key, parts[index] ?? ""]));
  });
}

function toPerfumeRecord(row) {
  const accords = [row.mainaccord1, row.mainaccord2, row.mainaccord3, row.mainaccord4, row.mainaccord5]
    .map((value) => value?.trim())
    .filter(Boolean);

  const brandName = titleizeSlug(row.Brand.trim());
  const perfumeName = titleizeSlug(row.Perfume.trim());
  const brandSlug = slugify(row.Brand.trim());
  const perfumeSlug = slugify(row.Perfume.trim());
  const year = Number.parseInt(row.Year, 10) || null;
  const perfumers = [
    ...splitCsvList(row.Perfumer || row.Perfumers || row.Nose || ""),
    ...splitCsvList(row.Perfumer1 || ""),
    ...splitCsvList(row.Perfumer2 || ""),
  ];

  return {
    slug: `${brandSlug}-${perfumeSlug}`,
    brand_slug: brandSlug,
    name: perfumeName,
    brand: brandName,
    source_url: row.url?.trim() || "https://www.fragrantica.com",
    country: row.Country?.trim() || null,
    image_url: null,
    gender: row.Gender?.trim() || "unisex",
    year,
    concentration: null,
    perfumers,
    top_notes: splitCsvList(row.Top),
    mid_notes: splitCsvList(row.Middle),
    base_notes: splitCsvList(row.Base),
    families: accords.map((accord) => titleizeSlug(accord.replace(/\s+/g, "-"))),
    longevity: 0,
    projection: 0,
    seasons: [],
    occasions: [],
    impressions: accords.map((accord) => titleizeSlug(accord.replace(/\s+/g, "-"))),
    price_range: "$$",
    scent_vector: buildVector(accords),
    rating_avg: Number.parseFloat((row["Rating Value"] || "0").replace(",", ".")) || 0,
    rating_count: Number.parseInt(row["Rating Count"], 10) || 0,
  };
}

function toBrandRecord(row) {
  return {
    slug: slugify(row.Brand.trim()),
    name: titleizeSlug(row.Brand.trim()),
    country: row.Country?.trim() || null,
  };
}

const rawCsv = fs.readFileSync(path.resolve(csvPath), "latin1");
const rows = parseRows(rawCsv);
const perfumes = rows.map(toPerfumeRecord);

const slugSeen = new Map();
for (const perfume of perfumes) {
  const base = perfume.slug;
  const count = slugSeen.get(base) ?? 0;
  if (count > 0) {
    perfume.slug = `${base}-${count + 1}`;
  }
  slugSeen.set(base, count + 1);
}

const brandMap = new Map();
for (const row of rows) {
  const brand = toBrandRecord(row);
  const current = brandMap.get(brand.slug);
  if (!current) {
    brandMap.set(brand.slug, { ...brand, perfume_count: 1 });
  } else {
    current.perfume_count += 1;
  }
}

const brands = [...brandMap.values()].sort((a, b) => b.perfume_count - a.perfume_count);

console.log(`Parsed ${perfumes.length} perfumes across ${brands.length} brands from ${csvPath}`);

if (dryRun) {
  console.log(JSON.stringify({ sampleBrand: brands[0], samplePerfume: perfumes[0] }, null, 2));
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: brandError } = await supabase.from("brands").upsert(brands, { onConflict: "slug" });
if (brandError) {
  console.warn(`Skipping brands import: ${brandError.message}`);
}

for (let index = 0; index < perfumes.length; index += batchSize) {
  const batch = perfumes.slice(index, index + batchSize);
  const { error } = await supabase.from("perfumes").upsert(batch, { onConflict: "slug" });
  if (error) throw error;
  console.log(`Imported ${Math.min(index + batch.length, perfumes.length)} / ${perfumes.length}`);
}

console.log("Perfume import completed successfully.");
