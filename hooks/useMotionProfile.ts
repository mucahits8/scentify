import { useMemo } from "react";
import { PixelRatio, Platform, useWindowDimensions } from "react-native";

import { useMotionStore } from "@/stores/useMotionStore";

type MotionLevel = "high" | "normal";

export interface MotionProfile {
  isReducedMotion: boolean;
  level: MotionLevel;
  durationScale: number;
  distanceScale: number;
  parallaxScale: number;
  enableInertia: boolean;
}

function isLikelyLowPowerDevice(width: number, height: number) {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const pixelDensity = PixelRatio.get();

  if (Platform.OS === "android") {
    return shortSide <= 390 || longSide <= 780 || pixelDensity <= 2.5;
  }

  return shortSide <= 375 && pixelDensity <= 2.5;
}

export function useMotionProfile(): MotionProfile {
  const { width, height } = useWindowDimensions();
  const preference = useMotionStore((state) => state.preference);
  const systemReducedMotion = useMotionStore((state) => state.systemReducedMotion);

  return useMemo(() => {
    if (systemReducedMotion || preference === "minimal") {
      return {
        isReducedMotion: systemReducedMotion || preference === "minimal",
        level: "normal" as MotionLevel,
        durationScale: preference === "minimal" ? 0.72 : 0.68,
        distanceScale: preference === "minimal" ? 0.42 : 0.35,
        parallaxScale: preference === "minimal" ? 0.28 : 0.2,
        enableInertia: false,
      };
    }

    const lowPower = isLikelyLowPowerDevice(width, height);

    if (preference === "cinematic") {
      if (lowPower) {
        return {
          isReducedMotion: false,
          level: "normal" as MotionLevel,
          durationScale: 1,
          distanceScale: 0.95,
          parallaxScale: 0.9,
          enableInertia: true,
        };
      }
      return {
        isReducedMotion: false,
        level: "high" as MotionLevel,
        durationScale: 1.18,
        distanceScale: 1.14,
        parallaxScale: 1.18,
        enableInertia: true,
      };
    }

    if (lowPower) {
      return {
        isReducedMotion: false,
        level: "normal" as MotionLevel,
        durationScale: 0.82,
        distanceScale: 0.72,
        parallaxScale: 0.66,
        enableInertia: true,
      };
    }

    return {
      isReducedMotion: false,
      level: "normal" as MotionLevel,
      durationScale: 0.94,
      distanceScale: 0.88,
      parallaxScale: 0.82,
      enableInertia: true,
    };
  }, [height, preference, systemReducedMotion, width]);
}
