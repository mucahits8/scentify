import { useEffect } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { useUserStore } from "@/stores/useUserStore";

export function useAppBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const sessionUserId = useAuthStore((state) => state.session?.user?.id);
  const bootstrapUser = useUserStore((state) => state.bootstrap);
  const clearUser = useUserStore((state) => state.clear);
  const bootstrapCollection = useCollectionStore((state) => state.bootstrap);
  const clearCollection = useCollectionStore((state) => state.clear);
  const bootstrapSocialPrefs = useSocialPrefsStore((state) => state.bootstrap);
  const clearSocialPrefs = useSocialPrefsStore((state) => state.clear);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!authHydrated) return;

    if (!sessionUserId) {
      clearUser();
      clearCollection();
      clearSocialPrefs();
      return;
    }

    void bootstrapUser();
    void bootstrapCollection();
    void bootstrapSocialPrefs();
  }, [
    authHydrated,
    sessionUserId,
    bootstrapUser,
    clearUser,
    bootstrapCollection,
    clearCollection,
    bootstrapSocialPrefs,
    clearSocialPrefs,
  ]);
}
