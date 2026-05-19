import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { EntityVisual } from "@/components/ui/EntityVisual";
import { FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import type { Brand } from "@/utils/types";

export function BrandCard({ brand, onPress }: { brand: Brand; onPress?: () => void }) {
  const motion = useMotionProfile();
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
  }, [brand.id, introValue, motion.durationScale]);

  const cardMotion = {
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
  const imageParallax = {
    transform: [
      {
        scale: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 + (0.02 * motion.parallaxScale)],
        }),
      },
    ],
  };

  function handlePressIn() {
    Animated.timing(pressValue, { toValue: 1, duration: Math.max(90, Math.round(130 * motion.durationScale)), useNativeDriver: true }).start();
  }

  function handlePressOut() {
    Animated.timing(pressValue, { toValue: 0, duration: Math.max(100, Math.round(170 * motion.durationScale)), easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={[styles.wrapper, cardMotion]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <View style={styles.card}>
        <Animated.View style={imageParallax}>
          <EntityVisual imageUrl={brand.imageUrl ?? brand.heroImageUrl} label="brand · still life" tone="ink" height={100} />
        </Animated.View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {brand.name}
          </Text>
          <Text style={styles.meta}>
            {brand.country ? `${brand.country}  ·  ` : ""}
            {brand.perfumeCount} fragrances
          </Text>
          {brand.tagline ? (
            <Text style={styles.tagline} numberOfLines={2}>
              {brand.tagline}
            </Text>
          ) : null}
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    wrapper: {
      width: 200,
    },
    card: {
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...SHADOWS.soft,
    },
    body: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      gap: 4,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 20,
      lineHeight: 24,
      color: colors.ink,
    },
    meta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    tagline: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 17,
      color: colors.inkFaint,
    },
  });
