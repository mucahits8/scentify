import { SCENT_DIMENSIONS } from "@/utils/constants";
import type { Perfume } from "@/utils/types";
import type { ScanMatch, VisionCandidate, VisionResult } from "./types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return norm(s).split(" ").filter((t) => t.length >= 2);
}

function jaccardSim(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function tokenSetScore(queryStr: string, targetStr: string): number {
  const qTokens = tokens(queryStr);
  const tTokens = tokens(targetStr);
  const jaccard = jaccardSim(qTokens, tTokens);
  const containsBonus =
    norm(targetStr).includes(norm(queryStr)) || norm(queryStr).includes(norm(targetStr)) ? 0.15 : 0;
  return Math.min(1, jaccard + containsBonus);
}

function scorePair(candidate: VisionCandidate, perfume: Perfume): number {
  const brandScore = (() => {
    if (norm(candidate.brand) === norm(perfume.brand)) return 1.0;
    if (norm(perfume.brand).startsWith(norm(candidate.brand))) return 0.85;
    return jaccardSim(tokens(candidate.brand), tokens(perfume.brand)) * 0.7;
  })();

  const nameScore = tokenSetScore(candidate.name, perfume.name);

  const concScore = (() => {
    if (!candidate.concentration || !perfume.concentration) return 0.5;
    return norm(candidate.concentration) === norm(perfume.concentration) ? 1.0 : 0.0;
  })();

  const raw = 0.45 * nameScore + 0.40 * brandScore + 0.15 * concScore;
  return raw * candidate.confidence;
}

export function matchCandidatesToCatalog(candidates: VisionCandidate[], catalog: Perfume[]): ScanMatch[] {
  return candidates.map((candidate) => {
    let bestPerfume: Perfume | null = null;
    let bestScore = 0;

    for (const perfume of catalog) {
      const score = scorePair(candidate, perfume);
      if (score > bestScore) {
        bestScore = score;
        bestPerfume = perfume;
      }
    }

    const matchedBy =
      bestScore >= 0.80 ? "brand+name" :
      bestScore >= 0.55 ? "fuzzy" : "none";

    return {
      perfume: matchedBy !== "none" ? bestPerfume : null,
      matchScore: bestScore,
      matchedBy,
      candidate,
    };
  });
}

export function buildStubPerfume(candidate: VisionCandidate): Perfume {
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const id = `scan-${slugify(candidate.brand)}-${slugify(candidate.name)}-${Date.now()}`;

  return {
    id,
    slug: slugify(`${candidate.brand}-${candidate.name}`),
    name: candidate.name,
    brand: candidate.brand,
    brandSlug: slugify(candidate.brand),
    gender: "unisex",
    concentration: candidate.concentration ?? undefined,
    topNotes: [],
    midNotes: [],
    baseNotes: [],
    families: [],
    longevity: 0,
    projection: 0,
    seasons: [],
    occasions: [],
    impressions: [],
    priceRange: "$$",
    scentVector: new Array(SCENT_DIMENSIONS.length).fill(0),
  };
}
