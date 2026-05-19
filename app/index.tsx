import { Redirect } from "expo-router";

import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";

export default function IndexScreen() {
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);
  const profile = useUserStore((state) => state.profile);
  const isUserHydrated = useUserStore((state) => state.isHydrated);

  if (!isAuthHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isUserHydrated) {
    return null;
  }

  if (!profile?.onboardingCompleted) {
    return <Redirect href="/(onboarding)/gender" />;
  }

  return <Redirect href="/(main)" />;
}
