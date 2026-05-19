import { SCENT_DIMENSIONS } from "@/utils/constants";
import type { ScentDNAProfile, ScentDimension, ScentVector } from "@/utils/types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function createEmptyVector(): ScentVector {
  return SCENT_DIMENSIONS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as ScentVector);
}

export function vectorFromArray(values: number[]): ScentVector {
  return SCENT_DIMENSIONS.reduce((acc, key, index) => {
    acc[key] = values[index] ?? 0;
    return acc;
  }, {} as ScentVector);
}

export function topDimensions(profile: ScentDNAProfile, limit = 5) {
  return [...SCENT_DIMENSIONS]
    .map((key) => ({ key, value: profile[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function dimensionLabel(key: ScentDimension) {
  return sentenceCase(key);
}
