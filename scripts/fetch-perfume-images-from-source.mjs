import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
}

const limit = Number(process.env.IMAGE_FETCH_LIMIT || process.argv[2] || 1200);
const concurrency = Number(process.env.IMAGE_FETCH_CONCURRENCY || process.argv[3] || 6);
const fetchTimeoutMs = Number(process.env.IMAGE_FETCH_TIMEOUT_MS || process.argv[4] || 10000);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function extractMetaImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function looksValidImageUrl(url) {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  return !url.includes("data:image/");
}

function extractFragranticaId(sourceUrl) {
  if (!sourceUrl) return null;
  const match = sourceUrl.match(/-(\d+)\.html(?:[?#].*)?$/i);
  return match?.[1] ?? null;
}

function isFragranticaUrl(sourceUrl) {
  return typeof sourceUrl === "string" && sourceUrl.includes("fragrantica.com/perfume/");
}

function buildFragranticaBottleUrl(perfumeId) {
  if (!perfumeId) return null;
  return `https://fimgs.net/mdimg/perfume/375x500.${perfumeId}.jpg`;
}

function buildFragranticaHighResUrl(perfumeId) {
  if (!perfumeId) return null;
  return `https://fimgs.net/himg/o.${perfumeId}.jpg`;
}

function buildFragranticaCardUrl(perfumeId) {
  if (!perfumeId) return null;
  return `https://fimgs.net/mdimg/perfume-social-cards/en-social-${perfumeId}.jpeg`;
}

async function headImageUrl(url) {
  if (!url) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "ScentifyMediaBot/1.0 (+https://scentify.app)",
      },
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.startsWith("image/")) return null;
    return url;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveFragranticaCardImage(sourceUrl) {
  const perfumeId = extractFragranticaId(sourceUrl);
  if (!perfumeId) return null;

  const candidates = [
    buildFragranticaBottleUrl(perfumeId),
    buildFragranticaHighResUrl(perfumeId),
    buildFragranticaCardUrl(perfumeId),
  ];

  for (const candidate of candidates) {
    const valid = await headImageUrl(candidate);
    if (valid) return valid;
  }

  return null;
}

async function fetchImageUrl(sourceUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
  let response;
  try {
    response = await fetch(sourceUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "ScentifyMediaBot/1.0 (+https://scentify.app)",
        "accept-language": "en-US,en;q=0.9",
        accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const imageUrl = extractMetaImage(html);
  return looksValidImageUrl(imageUrl) ? imageUrl : null;
}

async function runWorker(rows, state) {
  for (;;) {
    const index = state.cursor++;
    if (index >= rows.length) break;
    const row = rows[index];
    if (!row.source_url || row.source_url === "https://www.fragrantica.com") {
      state.skipped += 1;
      continue;
    }

    try {
      let imageUrl = null;
      let sourceKind = "none";

      if (isFragranticaUrl(row.source_url)) {
        imageUrl = await resolveFragranticaCardImage(row.source_url);
        if (imageUrl) sourceKind = "pattern";
      }

      if (!imageUrl) {
        imageUrl = await fetchImageUrl(row.source_url);
        if (imageUrl) sourceKind = "scrape";
      }

      if (!imageUrl) {
        state.noImage += 1;
        continue;
      }

      const { error } = await supabase
        .from("perfumes")
        .update({ image_url: imageUrl })
        .eq("id", row.id);

      if (error) {
        state.failed += 1;
      } else {
        state.updated += 1;
        if (sourceKind === "pattern") state.fromPattern += 1;
        if (sourceKind === "scrape") state.fromScrape += 1;
      }
    } catch {
      state.failed += 1;
    }

    state.processed += 1;
    if (state.processed % 100 === 0) {
      console.log(
        `processed=${state.processed} updated=${state.updated} pattern=${state.fromPattern} scrape=${state.fromScrape} no_image=${state.noImage} failed=${state.failed} skipped=${state.skipped}`,
      );
    }
  }
}

const totalState = {
  cursor: 0,
  processed: 0,
  updated: 0,
  fromPattern: 0,
  fromScrape: 0,
  noImage: 0,
  failed: 0,
  skipped: 0,
};

let remaining = Math.max(0, limit);
let batchIndex = 0;

while (remaining > 0) {
  const batchSize = Math.min(1000, remaining);
  const { data: rows, error } = await supabase
    .from("perfumes")
    .select("id,source_url,image_url")
    .or("image_url.like.%dummyimage.com%,image_url.is.null")
    .not("source_url", "is", null)
    .neq("source_url", "https://www.fragrantica.com")
    .limit(batchSize);

  if (error) throw error;

  const candidates = rows ?? [];
  if (candidates.length === 0) break;

  const batchState = {
    cursor: 0,
    processed: 0,
    updated: 0,
    fromPattern: 0,
    fromScrape: 0,
    noImage: 0,
    failed: 0,
    skipped: 0,
  };

  batchIndex += 1;
  console.log(`Batch ${batchIndex}: found ${candidates.length} candidates.`);

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => runWorker(candidates, batchState)),
  );

  totalState.processed += batchState.processed;
  totalState.updated += batchState.updated;
  totalState.fromPattern += batchState.fromPattern;
  totalState.fromScrape += batchState.fromScrape;
  totalState.noImage += batchState.noImage;
  totalState.failed += batchState.failed;
  totalState.skipped += batchState.skipped;

  remaining -= candidates.length;
  console.log(
    `Batch ${batchIndex} done. processed=${batchState.processed} updated=${batchState.updated} pattern=${batchState.fromPattern} scrape=${batchState.fromScrape} no_image=${batchState.noImage} failed=${batchState.failed} skipped=${batchState.skipped}`,
  );

  if (candidates.length < batchSize) break;
}

console.log(
  `Done. processed=${totalState.processed} updated=${totalState.updated} pattern=${totalState.fromPattern} scrape=${totalState.fromScrape} no_image=${totalState.noImage} failed=${totalState.failed} skipped=${totalState.skipped}`,
);
