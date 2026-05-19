import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";

import { useMotionStore } from "@/stores/useMotionStore";

let isListening = false;

export function useMotionBootstrap() {
  const setSystemReducedMotion = useMotionStore((state) => state.setSystemReducedMotion);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setSystemReducedMotion(enabled);
      })
      .catch(() => {});

    if (isListening) {
      return () => {
        isMounted = false;
      };
    }

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setSystemReducedMotion(enabled);
    });
    isListening = true;

    return () => {
      isMounted = false;
      subscription.remove();
      isListening = false;
    };
  }, [setSystemReducedMotion]);
}
