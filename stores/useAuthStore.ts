import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

import { getSession, onAuthStateChange } from "@/services/auth";

export const DEMO_USER_ID = "demo-user";

interface AuthState {
  session: Session | null;
  isHydrated: boolean;
  bootstrap: () => Promise<void>;
  setDemoSession: () => void;
  clearSession: () => void;
}

let isListening = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  bootstrap: async () => {
    const session = await getSession();
    set({ session, isHydrated: true });

    if (!isListening) {
      onAuthStateChange((nextSession) => set({ session: nextSession }));
      isListening = true;
    }
  },
  setDemoSession: () =>
    set({
      session: {
        access_token: "demo-access-token",
        refresh_token: "demo-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: {
          id: DEMO_USER_ID,
          app_metadata: {},
          user_metadata: { full_name: "Demo User" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
      } as Session,
      isHydrated: true,
    }),
  clearSession: () => set({ session: null }),
}));
