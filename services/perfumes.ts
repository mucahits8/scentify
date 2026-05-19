import { isSupabaseConfigured, requireSupabase } from "@/services/supabase";
import { mockBrands, mockPerfumers, mockPerfumes } from "@/services/mock-data";
import type { Brand, Perfume, Perfumer } from "@/utils/types";

const CACHE_TTL_MS = 5 * 60 * 1000;
const REMOTE_QUERY_TIMEOUT_MS = 1200;

type CachedValue<T> = {
  data: T;
  ts: number;
};

let cachedAllPerfumes: CachedValue<Perfume[]> | null = null;
const cachedPerfumesByLimit = new Map<number, CachedValue<Perfume[]>>();

function withTimeout<T>(promise: PromiseLike<T>, ms = REMOTE_QUERY_TIMEOUT_MS): Promise<T> {
  const normalizedPromise = Promise.resolve(promise);
  return Promise.race([
    normalizedPromise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Remote query timed out.")), ms);
    }),
  ]);
}

function isCacheFresh(ts: number) {
  return Date.now() - ts < CACHE_TTL_MS;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export type PerfumeRow = {
  id: string;
  slug: string | null;
  name: string;
  brand: string;
  brand_slug: string | null;
  source_url: string | null;
  country: string | null;
  image_url: string | null;
  gender: "men" | "women" | "unisex";
  year: number | null;
  concentration: string | null;
  perfumers: string[] | null;
  top_notes: string[];
  mid_notes: string[];
  base_notes: string[];
  families: string[];
  longevity: number;
  projection: number;
  seasons: string[];
  occasions: string[];
  impressions: string[];
  price_range: "$" | "$$" | "$$$" | "$$$$";
  scent_vector: number[];
  rating_avg: number | null;
  rating_count: number | null;
};

type BrandRow = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  perfume_count: number;
  image_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
};

type PerfumerRow = {
  id: string;
  slug: string;
  name: string;
  portrait_url: string | null;
  city: string | null;
  country: string | null;
  quote: string | null;
  perfume_count: number;
  signature_families: string[] | null;
  brands: string[] | null;
};

export function mapPerfumeRow(row: PerfumeRow): Perfume {
  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    brand: row.brand,
    brandSlug: row.brand_slug ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    country: row.country ?? undefined,
    imageUrl: row.image_url ?? undefined,
    gender: row.gender,
    year: row.year ?? undefined,
    concentration: row.concentration ?? undefined,
    perfumers: row.perfumers ?? [],
    topNotes: row.top_notes ?? [],
    midNotes: row.mid_notes ?? [],
    baseNotes: row.base_notes ?? [],
    families: row.families ?? [],
    longevity: Number(row.longevity ?? 0),
    projection: Number(row.projection ?? 0),
    seasons: row.seasons ?? [],
    occasions: row.occasions ?? [],
    impressions: row.impressions ?? [],
    priceRange: row.price_range ?? "$$",
    scentVector: row.scent_vector ?? new Array(14).fill(0),
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
  };
}

function mapBrandRow(row: BrandRow): Brand {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    perfumeCount: row.perfume_count,
    imageUrl: row.image_url,
    heroImageUrl: row.hero_image_url,
    tagline: row.tagline,
  };
}

function mapPerfumerRow(row: PerfumerRow): Perfumer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    portraitUrl: row.portrait_url,
    city: row.city,
    country: row.country,
    quote: row.quote,
    perfumeCount: row.perfume_count ?? 0,
    signatureFamilies: row.signature_families ?? [],
    brands: row.brands ?? [],
  };
}

function buildDerivedBrands(perfumes: Perfume[]) {
  const grouped = new Map<string, Brand>();
  perfumes.forEach((perfume) => {
    const slug = perfume.brandSlug ?? slugify(perfume.brand);
    const current = grouped.get(slug);
    if (current) {
      current.perfumeCount += 1;
      return;
    }

    grouped.set(slug, {
      id: `derived-${slug}`,
      slug,
      name: perfume.brand,
      country: perfume.country ?? null,
      perfumeCount: 1,
      imageUrl: null,
      heroImageUrl: null,
      tagline: null,
    });
  });

  return [...grouped.values()].sort((a, b) => b.perfumeCount - a.perfumeCount);
}

function buildDerivedPerfumers(perfumes: Perfume[]) {
  const grouped = new Map<string, Perfumer>();

  perfumes.forEach((perfume) => {
    (perfume.perfumers ?? []).forEach((name) => {
      const slug = slugify(name);
      const current = grouped.get(slug);
      const families = perfume.families.slice(0, 3);

      if (!current) {
        grouped.set(slug, {
          id: `perfumer-${slug}`,
          slug,
          name,
          portraitUrl: null,
          city: null,
          country: null,
          quote: null,
          perfumeCount: 1,
          signatureFamilies: [...families],
          brands: [perfume.brand],
        });
        return;
      }

      current.perfumeCount += 1;
      current.signatureFamilies = [...new Set([...current.signatureFamilies, ...families])].slice(0, 4);
      current.brands = [...new Set([...current.brands, perfume.brand])].slice(0, 6);
    });
  });

  return [...grouped.values()].sort((a, b) => b.perfumeCount - a.perfumeCount);
}

const PAGE_SIZE = 50;

export async function getPerfumesPage(page: number): Promise<{ data: Perfume[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (!isSupabaseConfigured) {
    const slice = mockPerfumes.slice(from, to + 1);
    return { data: slice, hasMore: to < mockPerfumes.length - 1 };
  }

  try {
    const { data, error, count } = await withTimeout(requireSupabase()
      .from("perfumes")
      .select("*", { count: "exact" })
      .order("rating_count", { ascending: false })
      .range(from, to));

    if (error) throw error;
    const mapped = (data ?? []).map((row) => mapPerfumeRow(row as PerfumeRow));
    const total = count ?? 0;
    return { data: mapped, hasMore: to < total - 1 };
  } catch {
    const slice = mockPerfumes.slice(from, to + 1);
    return { data: slice, hasMore: to < mockPerfumes.length - 1 };
  }
}

export async function getPerfumesByFamily(family: string, page: number): Promise<{ data: Perfume[]; hasMore: boolean }> {
  const normalizedFamily = family.trim();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (!normalizedFamily || normalizedFamily.toLowerCase() === "all") {
    return getPerfumesPage(page);
  }

  if (!isSupabaseConfigured) {
    const matches = mockPerfumes.filter((perfume) =>
      perfume.families.some((value) => value.toLowerCase() === normalizedFamily.toLowerCase()),
    );
    const slice = matches.slice(from, to + 1);
    return { data: slice, hasMore: to < matches.length - 1 };
  }

  try {
    const { data, error, count } = await withTimeout(requireSupabase()
      .from("perfumes")
      .select("*", { count: "exact" })
      .contains("families", [normalizedFamily])
      .order("rating_count", { ascending: false })
      .range(from, to));

    if (error) throw error;
    const mapped = (data ?? []).map((row) => mapPerfumeRow(row as PerfumeRow));
    if (mapped.length === 0) {
      const broadPool = await getPerfumes(2000);
      const broadMatches = broadPool.filter((perfume) =>
        perfume.families.some((value) => value.toLowerCase().includes(normalizedFamily.toLowerCase())),
      );
      const fallbackSlice = broadMatches.slice(from, to + 1);
      return { data: fallbackSlice, hasMore: to < broadMatches.length - 1 };
    }
    const total = count ?? 0;
    return { data: mapped, hasMore: to < total - 1 };
  } catch {
    const fallbackMatches = mockPerfumes.filter((perfume) =>
      perfume.families.some((value) => value.toLowerCase() === normalizedFamily.toLowerCase()),
    );
    const slice = fallbackMatches.slice(from, to + 1);
    return { data: slice, hasMore: to < fallbackMatches.length - 1 };
  }
}

export async function getPerfumes(limit?: number) {
  if (cachedAllPerfumes && isCacheFresh(cachedAllPerfumes.ts)) {
    return typeof limit === "number" ? cachedAllPerfumes.data.slice(0, limit) : cachedAllPerfumes.data;
  }

  if (typeof limit === "number") {
    const cachedLimited = cachedPerfumesByLimit.get(limit);
    if (cachedLimited && isCacheFresh(cachedLimited.ts)) {
      return cachedLimited.data;
    }
  }

  if (!isSupabaseConfigured) {
    return typeof limit === "number" ? mockPerfumes.slice(0, limit) : mockPerfumes;
  }

  try {
    const query = requireSupabase()
      .from("perfumes")
      .select("*")
      .order("rating_count", { ascending: false });

    if (typeof limit === "number") query.limit(limit);

    const { data, error } = await withTimeout(query);
    if (error) throw error;
    const mapped = (data ?? []).map((row) => mapPerfumeRow(row as PerfumeRow));
    if (mapped.length > 0) {
      if (typeof limit === "number") {
        cachedPerfumesByLimit.set(limit, { data: mapped, ts: Date.now() });
      } else {
        cachedAllPerfumes = { data: mapped, ts: Date.now() };
      }
      return mapped;
    }
  } catch {}

  return typeof limit === "number" ? mockPerfumes.slice(0, limit) : mockPerfumes;
}

export async function getPerfumeById(id: string) {
  const normalizedId = id?.trim();
  if (!normalizedId) return null;

  if (!isSupabaseConfigured) {
    return mockPerfumes.find((perfume) => perfume.id === normalizedId || perfume.slug === normalizedId) ?? null;
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("perfumes")
      .select("*")
      .or(`id.eq.${normalizedId},slug.eq.${normalizedId}`)
      .limit(1)
      .maybeSingle());

    if (error) throw error;
    if (data) return mapPerfumeRow(data as PerfumeRow);
  } catch {}

  // Check all in-memory caches before triggering a heavy network call.
  const matchInCache = (source: Perfume[]) =>
    source.find((p) => p.id === normalizedId || p.slug === normalizedId) ?? null;

  if (cachedAllPerfumes) {
    const found = matchInCache(cachedAllPerfumes.data);
    if (found) return found;
  }

  for (const cached of cachedPerfumesByLimit.values()) {
    if (isCacheFresh(cached.ts)) {
      const found = matchInCache(cached.data);
      if (found) return found;
    }
  }

  return matchInCache(mockPerfumes);
}

export async function searchPerfumes(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  if (!isSupabaseConfigured) {
    return mockPerfumes.filter((perfume) =>
      `${perfume.name} ${perfume.brand} ${perfume.families.join(" ")} ${(perfume.perfumers ?? []).join(" ")}`.toLowerCase().includes(normalized),
    );
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("perfumes")
      .select("*")
      .or(`name.ilike.%${normalized}%,brand.ilike.%${normalized}%`)
      .order("rating_count", { ascending: false })
      .limit(24));

    if (error) throw error;
    const mapped = (data ?? []).map((row) => mapPerfumeRow(row as PerfumeRow));
    if (mapped.length > 0) return mapped;
  } catch {}

  return mockPerfumes.filter((perfume) =>
    `${perfume.name} ${perfume.brand} ${perfume.families.join(" ")} ${(perfume.perfumers ?? []).join(" ")}`.toLowerCase().includes(normalized),
  );
}

export async function getBrands(limit = 16) {
  if (!isSupabaseConfigured) {
    return mockBrands.slice(0, limit);
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("brands")
      .select("*")
      .order("perfume_count", { ascending: false })
      .limit(limit));

    if (!error) return (data ?? []).map((row) => mapBrandRow(row as BrandRow));
  } catch {}

  const perfumes = await getPerfumes(2000);
  return buildDerivedBrands(perfumes).slice(0, limit);
}

export async function searchBrands(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  if (!isSupabaseConfigured) {
    return mockBrands.filter((brand) => brand.name.toLowerCase().includes(normalized));
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("brands")
      .select("*")
      .ilike("name", `%${normalized}%`)
      .order("perfume_count", { ascending: false })
      .limit(12));

    if (!error) return (data ?? []).map((row) => mapBrandRow(row as BrandRow));
  } catch {}

  const perfumeMatches = await searchPerfumes(query);
  return buildDerivedBrands(perfumeMatches);
}

export async function getBrandBySlug(slug: string) {
  if (!isSupabaseConfigured) {
    return mockBrands.find((brand) => brand.slug === slug) ?? null;
  }

  try {
    const { data, error } = await withTimeout(requireSupabase().from("brands").select("*").eq("slug", slug).maybeSingle());
    if (!error && data) return mapBrandRow(data as BrandRow);
  } catch {}

  const perfumes = await getPerfumesByBrandSlug(slug);
  if (!perfumes.length) return null;

  return {
    id: `derived-${slug}`,
    slug,
    name: perfumes[0].brand,
    country: perfumes[0].country ?? null,
    perfumeCount: perfumes.length,
    imageUrl: null,
    heroImageUrl: null,
    tagline: null,
  };
}

export async function getPerfumesByBrandSlug(brandSlug: string) {
  if (!isSupabaseConfigured) {
    return mockPerfumes.filter((perfume) => perfume.brandSlug === brandSlug);
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("perfumes")
      .select("*")
      .eq("brand_slug", brandSlug)
      .order("rating_count", { ascending: false }));

    if (!error) return (data ?? []).map((row) => mapPerfumeRow(row as PerfumeRow));
  } catch {}

  const candidates = await getPerfumes(5000);
  return candidates.filter((perfume) => (perfume.brandSlug ?? slugify(perfume.brand)) === brandSlug);
}

export async function getPerfumers(limit = 12) {
  if (!isSupabaseConfigured) {
    return mockPerfumers.slice(0, limit);
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("perfumers")
      .select("*")
      .order("perfume_count", { ascending: false })
      .limit(limit));

    if (!error && data?.length) {
      return data.map((row) => mapPerfumerRow(row as PerfumerRow));
    }
  } catch {}

  const perfumes = await getPerfumes(3000);
  return buildDerivedPerfumers(perfumes).slice(0, limit);
}

export async function searchPerfumers(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  if (!isSupabaseConfigured) {
    return mockPerfumers.filter((perfumer) => perfumer.name.toLowerCase().includes(normalized));
  }

  try {
    const { data, error } = await withTimeout(requireSupabase()
      .from("perfumers")
      .select("*")
      .ilike("name", `%${normalized}%`)
      .order("perfume_count", { ascending: false })
      .limit(24));

    if (!error && data?.length) {
      return data.map((row) => mapPerfumerRow(row as PerfumerRow));
    }
  } catch {}

  const perfumes = await searchPerfumes(query);
  return buildDerivedPerfumers(perfumes).filter((perfumer) => perfumer.name.toLowerCase().includes(normalized));
}

export async function getPerfumerBySlug(slug: string) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(requireSupabase().from("perfumers").select("*").eq("slug", slug).maybeSingle());
      if (!error && data) {
        return mapPerfumerRow(data as PerfumerRow);
      }
    } catch {}
  }

  const perfumers = await getPerfumers(200);
  return perfumers.find((perfumer) => perfumer.slug === slug) ?? null;
}

export async function getPerfumesByPerfumerSlug(slug: string) {
  const perfumes = await getPerfumes(1800);
  return perfumes.filter((perfume) => (perfume.perfumers ?? []).some((name) => slugify(name) === slug));
}

export async function getSimilarPerfumes(perfume: Perfume, limit = 6) {
  // Prefer already-loaded caches to avoid a redundant Supabase round-trip.
  // Pick the largest available fresh cache; fall back to fetching 900.
  let source: Perfume[] | null = null;
  if (cachedAllPerfumes && isCacheFresh(cachedAllPerfumes.ts)) {
    source = cachedAllPerfumes.data;
  } else {
    let bestSize = 0;
    for (const cached of cachedPerfumesByLimit.values()) {
      if (isCacheFresh(cached.ts) && cached.data.length > bestSize) {
        bestSize = cached.data.length;
        source = cached.data;
      }
    }
  }
  const perfumes = source ?? await getPerfumes(900);

  return perfumes
    .filter((candidate) => candidate.id !== perfume.id)
    .map((candidate) => {
      const familyOverlap = candidate.families.filter((family) => perfume.families.includes(family)).length;
      const noteOverlap = candidate.baseNotes.filter((note) => perfume.baseNotes.includes(note)).length;
      const perfumerOverlap = (candidate.perfumers ?? []).some((name) => (perfume.perfumers ?? []).includes(name)) ? 1 : 0;

      return {
        perfume: candidate,
        score: familyOverlap * 3 + noteOverlap * 2 + perfumerOverlap * 2,
      };
    })
    .sort((a, b) => b.score - a.score || (b.perfume.ratingCount ?? 0) - (a.perfume.ratingCount ?? 0))
    .slice(0, limit)
    .map((item) => item.perfume);
}
