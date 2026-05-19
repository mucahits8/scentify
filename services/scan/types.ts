import type { Perfume } from "@/utils/types";

export interface VisionCandidate {
  brand: string;
  name: string;
  concentration?: string | null;
  year?: number | null;
  confidence: number; // 0..1
  visibleText?: string[];
}

export interface VisionResult {
  candidates: VisionCandidate[];
  notRecognizable: boolean;
  rawText: string;
}

export interface ScanMatch {
  perfume: Perfume | null;
  matchScore: number; // 0..1
  matchedBy: "brand+name" | "fuzzy" | "none";
  candidate: VisionCandidate;
}
