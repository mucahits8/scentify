import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";

export default function OnboardingLayout() {
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const profile = useUserStore((state) => state.profile);
  const userHydrated = useUserStore((state) => state.isHydrated);

  if (!authHydrated || !userHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (profile?.onboardingCompleted) {
    return <Redirect href="/dna/result" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
