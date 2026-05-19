import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Perfume } from "@/utils/types";
import type { BudgetPreference, GenderPreference, IntensityPreference } from "@/utils/types";

interface OnboardingState {
  genderPreference?: GenderPreference;
  lovedPerfumeIds: string[];
  dislikedPerfumeIds: string[];
  ownedPerfumeIds: string[];
  preferredStyles: string[];
  avoidNotes: string[];
  usageContexts: string[];
  catalogPerfumes: Perfume[];
  intensityPreference?: IntensityPreference;
  budgetPreference?: BudgetPreference;
  weatherEnabled: boolean;
  setGenderPreference: (value: GenderPreference) => void;
  toggleLoved: (id: string) => void;
  toggleDisliked: (id: string) => void;
  toggleOwned: (id: string) => void;
  toggleStyle: (value: string) => void;
  toggleAvoidNote: (value: string) => void;
  toggleContext: (value: string) => void;
  setCatalogPerfumes: (perfumes: Perfume[]) => void;
  setIntensityPreference: (value: IntensityPreference) => void;
  setBudgetPreference: (value: BudgetPreference) => void;
  setWeatherEnabled: (value: boolean) => void;
  reset: () => void;
}

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const initialState = {
  lovedPerfumeIds: [] as string[],
  dislikedPerfumeIds: [] as string[],
  ownedPerfumeIds: [] as string[],
  preferredStyles: [] as string[],
  avoidNotes: [] as string[],
  usageContexts: [] as string[],
  catalogPerfumes: [] as Perfume[],
  weatherEnabled: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      setGenderPreference: (genderPreference) =>
        set({
          genderPreference,
          lovedPerfumeIds: [],
          dislikedPerfumeIds: [],
          ownedPerfumeIds: [],
        }),
      toggleLoved: (id) => set((state) => ({ lovedPerfumeIds: toggleValue(state.lovedPerfumeIds, id) })),
      toggleDisliked: (id) => set((state) => ({ dislikedPerfumeIds: toggleValue(state.dislikedPerfumeIds, id) })),
      toggleOwned: (id) => set((state) => ({ ownedPerfumeIds: toggleValue(state.ownedPerfumeIds, id) })),
      toggleStyle: (value) => set((state) => ({ preferredStyles: toggleValue(state.preferredStyles, value) })),
      toggleAvoidNote: (value) => set((state) => ({ avoidNotes: toggleValue(state.avoidNotes, value) })),
      toggleContext: (value) => set((state) => ({ usageContexts: toggleValue(state.usageContexts, value) })),
      setCatalogPerfumes: (catalogPerfumes) => set({ catalogPerfumes }),
      setIntensityPreference: (intensityPreference) => set({ intensityPreference }),
      setBudgetPreference: (budgetPreference) => set({ budgetPreference }),
      setWeatherEnabled: (weatherEnabled) => set({ weatherEnabled }),
      reset: () => set(initialState),
    }),
    {
      name: "scentify-onboarding",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        genderPreference: state.genderPreference,
        lovedPerfumeIds: state.lovedPerfumeIds,
        dislikedPerfumeIds: state.dislikedPerfumeIds,
        ownedPerfumeIds: state.ownedPerfumeIds,
        preferredStyles: state.preferredStyles,
        avoidNotes: state.avoidNotes,
        usageContexts: state.usageContexts,
        intensityPreference: state.intensityPreference,
        budgetPreference: state.budgetPreference,
        weatherEnabled: state.weatherEnabled,
      }),
    },
  ),
);
