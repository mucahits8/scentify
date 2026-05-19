import { BlurView } from "expo-blur";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { RADIUS, SHADOWS, SPACING } from "@/utils/constants";

interface CardProps extends ViewProps {
  variant?: "default" | "tinted" | "dark" | "flat" | "glass";
}

export function Card({ style, variant = "default", children, ...props }: CardProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  if (variant === "glass") {
    return (
      <View style={[styles.base, styles.glass, style]} {...props}>
        <BlurView intensity={isDark ? 34 : 24} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.glassTint} />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        variant === "default" && styles.default,
        variant === "tinted" && styles.tinted,
        variant === "dark" && styles.dark,
        variant === "flat" && styles.flat,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    base: {
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
    },
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...(isDark ? SHADOWS.soft : SHADOWS.card),
    },
    tinted: {
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accentMid,
    },
    dark: {
      backgroundColor: colors.heroSurface,
      borderWidth: 1,
      borderColor: isDark ? colors.border : "transparent",
    },
    glass: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: isDark ? colors.glassBorder : "rgba(0,0,0,0.06)",
      overflow: "hidden",
      ...(isDark ? SHADOWS.soft : SHADOWS.card),
    },
    glassTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? colors.glass : "rgba(255,255,255,0.7)",
    },
    flat: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
  });
