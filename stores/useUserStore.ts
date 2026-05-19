import { create } from "zustand";

import { calculateScentDNA } from "@/services/dna";
import { fetchCurrentUserBundle, saveOnboardingToSupabase } from "@/services/user-data";
import { mockDNA, mockPerfumes, mockProfile } from "@/services/mock-data";
import { isSupabaseConfigured } from "@/services/supabase";
import type { Perfume, ScentDNAProfile, UserProfile } from "@/utils/types";
import type { BudgetPreference, GenderPreference, IntensityPreference } from "@/utils/types";

interface UserState {
  profile: UserProfile | null;
  scentDNA: ScentDNAProfile | null;
  isHydrated: boolean;
  setProfile: (profile: UserProfile) => void;
  bootstrap: (options?: { demo?: boolean }) => Promise<void>;
  clear: () => void;
  completeOnboarding: (args: {
    genderPreference?: GenderPreference;
    budgetPreference?: BudgetPreference;
    intensityPreference?: IntensityPreference;
    usageContexts: string[];
    weatherEnabled: boolean;
    lovedIds: string[];
    dislikedIds: string[];
    ownedIds: string[];
    preferredStyles: string[];
    avoidNotes: string[];
    catalogPerfumes?: Perfume[];
  }) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  scentDNA: null,
  isHydrated: false,
  setProfile: (profile) => set({ profile }),
  bootstrap: async (options) => {
    set({ isHydrated: false });

    if (options?.demo || !isSupabaseConfigured) {
      set({ profile: mockProfile, scentDNA: mockDNA, isHydrated: true });
      return;
    }

    try {
      const { profile, scentDNA } = await fetchCurrentUserBundle();
      set((state) => {
        const shouldPreserveCompletedOnboarding =
          state.profile?.onboardingCompleted && !profile?.onboardingCompleted;

        const mergedProfile = shouldPreserveCompletedOnboarding
          ? {
              ...(profile ?? state.profile ?? mockProfile),
              onboardingCompleted: true,
            }
          : (profile ?? state.profile ?? null);

        return {
          profile: mergedProfile,
          scentDNA: scentDNA ?? state.scentDNA ?? null,
          isHydrated: true,
        };
      });
    } catch {
      set((state) => ({
        profile: state.profile,
        scentDNA: state.scentDNA,
        isHydrated: true,
      }));
    }
  },
  clear: () => set({ profile: null, scentDNA: null, isHydrated: true }),
  completeOnboarding: async ({
    genderPreference,
    budgetPreference,
    intensityPreference,
    usageContexts = [],
    weatherEnabled,
    lovedIds = [],
    dislikedIds = [],
    ownedIds = [],
    preferredStyles = [],
    avoidNotes = [],
    catalogPerfumes,
  }) => {
    const sourcePerfumes = catalogPerfumes?.length ? catalogPerfumes : mockPerfumes;
    const lovedPerfumes = sourcePerfumes.filter((perfume) => lovedIds.includes(perfume.id));
    const dislikedPerfumes = sourcePerfumes.filter((perfume) => dislikedIds.includes(perfume.id));
    const ownedPerfumes = sourcePerfumes.filter((perfume) => ownedIds.includes(perfume.id));

    const scentDNA = calculateScentDNA(
      lovedPerfumes,
      dislikedPerfumes,
      ownedPerfumes,
      preferredStyles,
      avoidNotes,
    );

    if (isSupabaseConfigured) {
      try {
        await saveOnboardingToSupabase({
          genderPreference,
          budgetPreference,
          intensityPreference,
          usageContexts,
          weatherEnabled,
          lovedIds,
          dislikedIds,
          ownedIds,
          preferredStyles,
          avoidNotes,
          catalogPerfumes: sourcePerfumes,
        });
      } catch {}
    }

    set((state) => ({
      profile: state.profile
        ? {
            ...state.profile,
            onboardingCompleted: true,
            genderPreference,
            budgetPreference,
            intensityPreference,
            weatherEnabled,
          }
        : {
            ...mockProfile,
            onboardingCompleted: true,
            genderPreference,
            budgetPreference,
            intensityPreference,
            weatherEnabled,
          },
      scentDNA,
      isHydrated: true,
    }));
  },
}));
