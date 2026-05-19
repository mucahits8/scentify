import { create } from "zustand";

import { callVisionAPI } from "@/services/scan/anthropicVision";
import { matchByText } from "@/services/scan/demoMatcher";
import type { PreparedImage } from "@/services/scan/imagePrep";
import { matchCandidatesToCatalog } from "@/services/scan/matchPerfume";
import type { ScanMatch, VisionResult } from "@/services/scan/types";
import { mockPerfumes } from "@/services/mock-data";

export type ScanStatus = "idle" | "processing" | "done" | "error";

interface ScanState {
  status: ScanStatus;
  imageUri: string | null;
  visionResult: VisionResult | null;
  matches: ScanMatch[];
  confirmedPerfumeIds: string[];
  errorMessage: string | null;

  runScan: (image: PreparedImage) => Promise<void>;
  runDemoScan: (query: string) => void;
  confirmMatch: (match: ScanMatch) => void;
  reset: () => void;
}

const INITIAL: Pick<ScanState, "status" | "imageUri" | "visionResult" | "matches" | "confirmedPerfumeIds" | "errorMessage"> = {
  status: "idle",
  imageUri: null,
  visionResult: null,
  matches: [],
  confirmedPerfumeIds: [],
  errorMessage: null,
};

export const useScanStore = create<ScanState>((set, get) => ({
  ...INITIAL,

  runScan: async (image) => {
    set({ status: "processing", imageUri: image.uri, errorMessage: null });
    try {
      const result = await callVisionAPI(image.base64, image.mimeType);
      const matches = matchCandidatesToCatalog(result.candidates, mockPerfumes);
      set({ status: "done", visionResult: result, matches });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "OPENAI_API_KEY_MISSING") {
        set({ status: "error", errorMessage: "api_key_missing" });
      } else {
        set({ status: "error", errorMessage: msg });
      }
    }
  },

  runDemoScan: (query) => {
    const matches = matchByText(query, mockPerfumes);
    set({
      status: "done",
      visionResult: {
        candidates: matches.map((m) => m.candidate),
        notRecognizable: matches.length === 0,
        rawText: query,
      },
      matches,
    });
  },

  confirmMatch: (match) => {
    const id = match.perfume?.id ?? match.candidate.name;
    set((state) => ({
      confirmedPerfumeIds: state.confirmedPerfumeIds.includes(id)
        ? state.confirmedPerfumeIds
        : [...state.confirmedPerfumeIds, id],
    }));
  },

  reset: () => set(INITIAL),
}));
