import "react-native-gesture-handler";
import "react-native-reanimated";

import { DMSerifDisplay_400Regular, useFonts as useSerifFonts } from "@expo-google-fonts/dm-serif-display";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as useSansFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";
import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { useMotionBootstrap } from "@/hooks/useMotionBootstrap";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  useAppBootstrap();
  useMotionBootstrap();
  const { colors, isDark } = useTheme();

  const [serifLoaded] = useSerifFonts({
    DMSerifDisplay_400Regular,
  });

  const [sansLoaded] = useSansFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (serifLoaded && sansLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [serifLoaded, sansLoaded]);

  if (!serifLoaded || !sansLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
          }}
        >
          <Stack.Screen name="create-sheet" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
