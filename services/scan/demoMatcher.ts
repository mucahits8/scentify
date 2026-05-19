import type { Perfume } from "@/utils/types";
import type { ScanMatch, VisionCandidate } from "./types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const tokA = norm(a).split(" ").filter((t) => t.length >= 2);
  const tokB = new Set(norm(b).split(" ").filter((t) => t.length >= 2));
  if (tokA.length === 0) return 0;
  const matched = tokA.filter((t) => tokB.has(t)).length;
  return matched / Math.max(tokA.length, tokB.size);
}

export function matchByText(query: string, catalog: Perfume[]): ScanMatch[] {
  if (!query.trim()) return [];

  const scored = catalog
    .map((perfume) => {
      const nameScore = tokenOverlap(query, perfume.name);
      const brandScore = tokenOverlap(query, perfume.brand);
      const score = 0.55 * nameScore + 0.45 * brandScore;
      return { perfume, score };
    })
    .filter(({ score }) => score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map(({ perfume, score }) => {
    const candidate: VisionCandidate = {
      brand: perfume.brand,
      name: perfume.name,
      concentration: perfume.concentration,
      confidence: score,
    };
    return {
      perfume,
      matchScore: score,
      matchedBy: score >= 0.6 ? "brand+name" : "fuzzy",
      candidate,
    };
  });
}
