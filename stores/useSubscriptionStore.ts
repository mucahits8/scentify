import { create } from "zustand";

interface SubscriptionState {
  isPremium: boolean;
  paywallShown: boolean;
  setPremium: (value: boolean) => void;
  setPaywallShown: (value: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  paywallShown: false,
  setPremium: (isPremium) => set({ isPremium }),
  setPaywallShown: (paywallShown) => set({ paywallShown }),
}));
