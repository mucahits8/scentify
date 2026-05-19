import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
}

const brandLimit = Number(process.env.BRAND_MEDIA_LIMIT || 400);
const perfumerLimit = Number(process.env.PERFUMER_MEDIA_LIMIT || 400);
const fetchTimeoutMs = Number(process.env.MEDIA_FETCH_TIMEOUT_MS || 8000);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function cleanExtract(text, max = 160) {
  if (!text) return null;
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return null;
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`;
}

async function fetchWithTimeout(url, init = {}, timeoutMs = fetchTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWikipediaTitle(query) {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("format", "json");
    url.searchParams.set("utf8", "1");
    url.searchParams.set("srlimit", "1");
    url.searchParams.set("srsearch", query);

    const response = await fetchWithTimeout(url, {
      headers: { "user-agent": "ScentifyMediaBot/1.0 (+https://scentify.app)" },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.query?.search?.[0]?.title ?? null;
  } catch {
    return null;
  }
}

async function fetchWikipediaSummary(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetchWithTimeout(url, {
      headers: { "user-agent": "ScentifyMediaBot/1.0 (+https://scentify.app)" },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function searchWikidataEntities(query, limit = 3) {
  try {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("language", "en");
    url.searchParams.set("type", "item");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("search", query);

    const response = await fetchWithTimeout(url, {
      headers: { "user-agent": "ScentifyMediaBot/1.0 (+https://scentify.app)" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    return (json?.search ?? []).map((item) => item?.id).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchWikidataEntity(entityId) {
  if (!entityId) return null;

  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(entityId)}.json`;
    const response = await fetchWithTimeout(url, {
      headers: { "user-agent": "ScentifyMediaBot/1.0 (+https://scentify.app)" },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.entities?.[entityId] ?? null;
  } catch {
    return null;
  }
}

function extractWikidataFile(entity, propertyCode) {
  const claim = entity?.claims?.[propertyCode]?.[0];
  const value = claim?.mainsnak?.datavalue?.value;
  if (!value || typeof value !== "string") return null;
  return value;
}

function commonsFileUrl(fileName) {
  if (!fileName) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

async function resolveWikidataImage(name, hint, logoPreferred = false) {
  const queries = [`${name} ${hint}`, `${name} perfume`, name];

  for (const query of queries) {
    const entityIds = await searchWikidataEntities(query, 3);
    for (const entityId of entityIds) {
      const entity = await fetchWikidataEntity(entityId);
      if (!entity) continue;

      const preferredProperty = logoPreferred ? "P154" : "P18";
      const fallbackProperty = logoPreferred ? "P18" : "P154";
      const preferredFile = extractWikidataFile(entity, preferredProperty);
      const fallbackFile = extractWikidataFile(entity, fallbackProperty);
      const fileName = preferredFile || fallbackFile;
      const fileUrl = commonsFileUrl(fileName);
      if (fileUrl) return fileUrl;
    }
  }

  return null;
}

async function resolveWikiMedia(name, hint) {
  const queries = [
    `${name} ${hint}`,
    `${name} perfume`,
    name,
  ];

  for (const query of queries) {
    const title = await searchWikipediaTitle(query);
    if (!title) continue;
    const summary = await fetchWikipediaSummary(title);
    if (!summary) continue;
    return summary;
  }

  return null;
}

async function enrichBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,slug,image_url,hero_image_url,tagline")
    .or("image_url.like.%dummyimage.com%,hero_image_url.like.%dummyimage.com%,image_url.is.null,hero_image_url.is.null")
    .order("perfume_count", { ascending: false })
    .limit(brandLimit);

  if (error) throw error;
  const rows = data ?? [];
  let updated = 0;

  for (const brand of rows) {
    const summary = await resolveWikiMedia(brand.name, "brand");
    const wikidataImage = summary?.thumbnail?.source
      ? null
      : await resolveWikidataImage(brand.name, "perfume house", true);

    const imageUrl = summary?.thumbnail?.source ?? wikidataImage ?? null;
    const tagline = cleanExtract(summary?.extract, 150);
    if (!imageUrl && !tagline) continue;

    const { error: updateError } = await supabase
      .from("brands")
      .update({
        image_url: imageUrl || brand.image_url,
        hero_image_url: imageUrl || brand.hero_image_url,
        tagline: (brand.tagline && !brand.tagline.startsWith("A signature house")) ? brand.tagline : (tagline || brand.tagline),
      })
      .eq("id", brand.id);

    if (!updateError) updated += 1;
    if ((updated + 1) % 20 === 0) {
      console.log(`brands progress: updated=${updated} scanned=${rows.length}`);
    }
  }

  return { scanned: rows.length, updated };
}

async function enrichPerfumers() {
  const { data, error } = await supabase
    .from("perfumers")
    .select("id,name,slug,portrait_url,quote,city,country")
    .or("portrait_url.like.%ui-avatars.com%,portrait_url.is.null")
    .order("perfume_count", { ascending: false })
    .limit(perfumerLimit);

  if (error) throw error;
  const rows = data ?? [];
  let updated = 0;

  for (const perfumer of rows) {
    const summary = await resolveWikiMedia(perfumer.name, "perfumer");
    const wikidataImage = summary?.thumbnail?.source
      ? null
      : await resolveWikidataImage(perfumer.name, "perfumer", false);

    const portraitUrl = summary?.thumbnail?.source ?? wikidataImage ?? null;
    const quote = cleanExtract(summary?.extract, 180);
    if (!portraitUrl && !quote) continue;

    const { error: updateError } = await supabase
      .from("perfumers")
      .update({
        portrait_url: portraitUrl || perfumer.portrait_url,
        quote:
          perfumer.quote && !perfumer.quote.startsWith("A perfumer shaping")
            ? perfumer.quote
            : (quote || perfumer.quote),
      })
      .eq("id", perfumer.id);

    if (!updateError) updated += 1;
    if ((updated + 1) % 20 === 0) {
      console.log(`perfumers progress: updated=${updated} scanned=${rows.length}`);
    }
  }

  return { scanned: rows.length, updated };
}

const brandRes = await enrichBrands();
const perfumerRes = await enrichPerfumers();

console.log(
  `Done. brands scanned=${brandRes.scanned} updated=${brandRes.updated}; perfumers scanned=${perfumerRes.scanned} updated=${perfumerRes.updated}`,
);
