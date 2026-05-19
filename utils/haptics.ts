import Constants from "expo-constants";
import { Vibration } from "react-native";

type HapticMode = "selection" | "impact" | "success";

let expoHapticsPromise: Promise<any | null> | null = null;

async function loadExpoHaptics() {
  if (!expoHapticsPromise) {
    const moduleName = "expo-haptics";
    expoHapticsPromise = import(moduleName)
      .then((mod) => mod)
      .catch(() => null);
  }
  return expoHapticsPromise;
}

function fallbackVibrate(mode: HapticMode) {
  if (mode === "success") {
    Vibration.vibrate([0, 24, 30, 24]);
    return;
  }
  Vibration.vibrate(mode === "impact" ? 14 : 8);
}

export async function triggerHaptic(mode: HapticMode) {
  // iOS/Android simulators often spam CoreHaptics warnings; skip custom haptics there.
  if (!Constants.isDevice) {
    return;
  }

  const haptics = await loadExpoHaptics();
  if (!haptics) {
    fallbackVibrate(mode);
    return;
  }

  try {
    if (mode === "selection" && haptics.selectionAsync) {
      await haptics.selectionAsync();
      return;
    }

    if (mode === "impact" && haptics.impactAsync && haptics.ImpactFeedbackStyle) {
      await haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (mode === "success" && haptics.notificationAsync && haptics.NotificationFeedbackType) {
      await haptics.notificationAsync(haptics.NotificationFeedbackType.Success);
      return;
    }
  } catch {}

  fallbackVibrate(mode);
}
