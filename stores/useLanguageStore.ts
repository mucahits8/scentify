import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppLanguage = "tr" | "en";

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "tr",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "scentify-language",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
