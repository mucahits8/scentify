import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MotionPreference = "cinematic" | "balanced" | "minimal";

interface MotionState {
  preference: MotionPreference;
  systemReducedMotion: boolean;
  setPreference: (preference: MotionPreference) => void;
  setSystemReducedMotion: (value: boolean) => void;
}

export const useMotionStore = create<MotionState>()(
  persist(
    (set) => ({
      preference: "balanced",
      systemReducedMotion: false,
      setPreference: (preference) => set({ preference }),
      setSystemReducedMotion: (systemReducedMotion) => set({ systemReducedMotion }),
    }),
    {
      name: "scentify-motion",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preference: state.preference,
      }),
    },
  ),
);
