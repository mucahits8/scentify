import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { Chip } from "@/components/ui/Chip";
import { EntityVisual } from "@/components/ui/EntityVisual";
import { FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import type { Perfumer } from "@/utils/types";

export function PerfumerCard({ perfumer, onPress }: { perfumer: Perfumer; onPress?: () => void }) {
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
  }, [introValue, motion.durationScale, perfumer.id]);

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
          outputRange: [1, 1 - (0.014 * motion.distanceScale)],
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
        <EntityVisual imageUrl={perfumer.portraitUrl} label="portrait" tone="warm" height={72} />

        <Text style={styles.name} numberOfLines={2}>
          {perfumer.name}
        </Text>
        <Text style={styles.meta}>
          {perfumer.city ? `${perfumer.city} · ` : ""}
          {perfumer.perfumeCount} works
        </Text>

        {perfumer.signatureFamilies.length > 0 ? (
          <View style={styles.chips}>
            {perfumer.signatureFamilies.slice(0, 2).map((family) => (
              <Chip key={family} label={family} size="sm" />
            ))}
          </View>
        ) : null}
      </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    wrapper: {
      width: 210,
    },
    card: {
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: SPACING.sm,
      minHeight: 160,
      ...SHADOWS.soft,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 20,
      lineHeight: 25,
      color: colors.ink,
    },
    meta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
      marginTop: 2,
    },
  });
