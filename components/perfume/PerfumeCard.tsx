import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { EditorialVisual } from "@/components/ui/EditorialVisual";
import { FAMILY_GRADIENTS, FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import { localizeScentLabel } from "@/utils/scentLabels";
import type { Perfume } from "@/utils/types";

function familyGradient(perfume: Perfume): [string, string] {
  const family = perfume.families?.[0];
  return (family ? FAMILY_GRADIENTS[family] : undefined) ?? FAMILY_GRADIENTS.Default;
}

export function PerfumeCard({
  perfume,
  matchScore,
  onPress,
  selected,
}: {
  perfume: Perfume;
  matchScore?: number;
  onPress?: () => void;
  selected?: boolean;
}) {
  const [gradStart, gradEnd] = familyGradient(perfume);
  const [imageFailed, setImageFailed] = useState(false);
  const motion = useMotionProfile();
  const { colors, isDark } = useTheme();
  const { language } = useI18n();
  const styles = createStyles(colors, isDark);
  const introValue = useRef(new Animated.Value(0)).current;
  const pressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    introValue.setValue(0);
    Animated.timing(introValue, {
      toValue: 1,
      duration: Math.max(200, Math.round(360 * motion.durationScale)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [introValue, motion.durationScale, perfume.id]);

  const introStyle = {
    opacity: introValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: introValue.interpolate({
          inputRange: [0, 1],
          outputRange: [12 * motion.distanceScale, 0],
        }),
      },
      {
        scale: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 - (0.015 * motion.distanceScale)],
        }),
      },
    ],
  };
  const imageFloatStyle = {
    transform: [
      {
        translateY: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3 * motion.parallaxScale],
        }),
      },
      {
        scale: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 + (0.03 * motion.parallaxScale)],
        }),
      },
    ],
  };

  function handlePressIn() {
    Animated.timing(pressValue, {
      toValue: 1,
      duration: Math.max(90, Math.round(140 * motion.durationScale)),
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.timing(pressValue, {
      toValue: 0,
      duration: Math.max(100, Math.round(170 * motion.durationScale)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={[styles.wrapper, introStyle, selected && styles.selectedWrapper]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <View style={styles.card}>
        {/* Image / gradient placeholder */}
        <View style={styles.imageWrap}>
          {perfume.imageUrl && !imageFailed ? (
            <Animated.Image
              source={{ uri: perfume.imageUrl }}
              style={[StyleSheet.absoluteFill, imageFloatStyle]}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <>
              <Animated.View style={[StyleSheet.absoluteFill, imageFloatStyle]}>
                <LinearGradient
                  colors={[gradStart, gradEnd]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <EditorialVisual label="hero · perfume bottle" tone="warm" height={156} />
              </Animated.View>
            </>
          )}
          {imageFailed ? (
            <>
              <View style={styles.imageVeil} />
              <EditorialVisual label="hero · perfume bottle" tone="warm" height={156} />
            </>
          ) : null}

          {/* Family label on image */}
          {perfume.families?.[0] ? (
            <View style={styles.familyPill}>
              <Text style={styles.familyText}>{localizeScentLabel(perfume.families[0], language)}</Text>
            </View>
          ) : null}

          {/* Match score */}
          {typeof matchScore === "number" ? (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{matchScore}%</Text>
            </View>
          ) : null}
        </View>

        {/* Text */}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {perfume.name}
          </Text>
          <Text style={styles.brand} numberOfLines={1}>
            {perfume.brand}
          </Text>
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      width: 168,
    },
    selectedWrapper: {
      opacity: 0.9,
    },
    card: {
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...(isDark ? SHADOWS.soft : SHADOWS.soft),
    },
    imageWrap: {
      height: 156,
      position: "relative",
      overflow: "hidden",
      backgroundColor: colors.surfaceMuted,
    },
    imageVeil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(28,24,21,0.20)" : "rgba(255,255,255,0.18)",
    },
    familyPill: {
      position: "absolute",
      bottom: SPACING.sm,
      left: SPACING.sm,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      backgroundColor: isDark ? "rgba(28,24,21,0.62)" : "rgba(255,255,255,0.75)",
      borderWidth: 1,
      borderColor: isDark ? colors.glassBorder : "transparent",
    },
    familyText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 10,
      color: colors.ink,
      letterSpacing: 0.3,
    },
    matchBadge: {
      position: "absolute",
      top: SPACING.sm,
      right: SPACING.sm,
      backgroundColor: colors.accent,
      borderRadius: RADIUS.full,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    matchText: {
      color: colors.accentForeground,
      fontFamily: FONTS.sansBold,
      fontSize: 11,
    },
    body: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md + 2,
      gap: 3,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 16,
      lineHeight: 20,
      color: colors.ink,
    },
    brand: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
  });
