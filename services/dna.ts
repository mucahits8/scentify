import { SCENT_DIMENSIONS } from "@/utils/constants";
import { clamp, createEmptyVector, vectorFromArray } from "@/utils/helpers";
import type { Perfume, ScentDNAProfile, ScentVector } from "@/utils/types";

export function mapNoteToCategory(note: string) {
  const normalized = note.toLowerCase();
  if (normalized.includes("oud") || normalized.includes("leather")) return "leather";
  if (normalized.includes("vanilla") || normalized.includes("coconut")) return "vanilla";
  if (normalized.includes("rose") || normalized.includes("lavender")) return "floral";
  if (normalized.includes("patchouli") || normalized.includes("tobacco")) return "oriental";
  if (normalized.includes("cinnamon")) return "spicy";
  return undefined;
}

export function calculateScentDNA(
  lovedPerfumes: Perfume[],
  dislikedPerfumes: Perfume[],
  ownedPerfumes: Perfume[],
  preferredStyles: string[],
  avoidNotes: string[],
): ScentDNAProfile {
  const vector = createEmptyVector();

  const applyPerfumeWeight = (perfume: Perfume, weight: number) => {
    SCENT_DIMENSIONS.forEach((key, index) => {
      vector[key] += (perfume.scentVector[index] ?? 0) * weight;
    });
  };

  lovedPerfumes.forEach((perfume) => applyPerfumeWeight(perfume, 2));
  ownedPerfumes.forEach((perfume) => applyPerfumeWeight(perfume, 1.5));
  dislikedPerfumes.forEach((perfume) => applyPerfumeWeight(perfume, -1));

  preferredStyles.forEach((style) => {
    const key = style.toLowerCase() as keyof ScentVector;
    if (key in vector) {
      vector[key] += 5;
    }
  });

  avoidNotes.forEach((note) => {
    const key = mapNoteToCategory(note) as keyof ScentVector | undefined;
    if (key) {
      vector[key] -= 8;
    }
  });

  const max = Math.max(...Object.values(vector), 1);
  SCENT_DIMENSIONS.forEach((key) => {
    vector[key] = clamp(Math.round((vector[key] / max) * 100), 0, 100);
  });

  const sorted = [...SCENT_DIMENSIONS].sort((a, b) => vector[b] - vector[a]);
  const profileTags = sorted.slice(0, 5).map((key) => key.charAt(0).toUpperCase() + key.slice(1));

  return {
    ...vector,
    profileTags,
    bestFamilies: [
      `${profileTags[0]} ${profileTags[1]}`,
      `${profileTags[1]} ${profileTags[2]}`,
      `${profileTags[0]} ${profileTags[2]}`,
    ],
    avoidNotes,
    summary: `You gravitate toward ${profileTags.slice(0, 2).join(", ").toLowerCase()} fragrances with ${profileTags[2].toLowerCase()} depth.`,
  };
}

export function calculateMatchScore(userDNA: ScentVector, perfumeVector: number[]) {
  const perfumeDNA = vectorFromArray(perfumeVector);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  SCENT_DIMENSIONS.forEach((key) => {
    const a = userDNA[key];
    const b = perfumeDNA[key];
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  });

  const cosineSimilarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) || 1);
  return Math.round(cosineSimilarity * 100);
}
