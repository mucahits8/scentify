import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { FAMILY_GRADIENTS, FONTS, RADIUS } from "@/utils/constants";
import type { Perfume } from "@/utils/types";

function PerfumeCard({
  item,
  index,
  cardWidth,
  selected,
  onToggle,
  colors,
  isDark,
  styles,
  motionDurationScale,
  motionDistanceScale,
  motionParallaxScale,
}: {
  item: Perfume;
  index: number;
  cardWidth: number;
  selected: boolean;
  onToggle: (id: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  styles: ReturnType<typeof createStyles>;
  motionDurationScale: number;
  motionDistanceScale: number;
  motionParallaxScale: number;
}) {
  const [isLoading, setIsLoading] = useState(!!item.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const introValue = useRef(new Animated.Value(0)).current;
  const pressValue = useRef(new Animated.Value(0)).current;
  const selectedPulse = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const descriptor = item.impressions?.slice(0, 2).join(" · ") || item.families?.slice(0, 2).join(" · ");
  const gradientColors = FAMILY_GRADIENTS[item.families?.[0] ?? ""] ?? (isDark ? [colors.surfaceAlt, colors.surface] : ["#E8D9C8", "#D7C5B2"]);

  useEffect(() => {
    introValue.setValue(0);
    Animated.timing(introValue, {
      toValue: 1,
      duration: Math.max(180, Math.round(340 * motionDurationScale)),
      delay: Math.min(220, Math.round(index * (26 * motionDurationScale))),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, introValue, item.id, motionDurationScale]);

  useEffect(() => {
    Animated.spring(selectedPulse, {
      toValue: selected ? 1 : 0,
      friction: 7,
      tension: 130,
      useNativeDriver: true,
    }).start();
  }, [selected, selectedPulse]);

  const cardMotion = {
    opacity: introValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: introValue.interpolate({
          inputRange: [0, 1],
          outputRange: [14 * motionDistanceScale, 0],
        }),
      },
      {
        scale: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 - (0.015 * motionDistanceScale)],
        }),
      },
    ],
  };
  const imageParallax = {
    transform: [
      {
        scale: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 + (0.03 * motionParallaxScale)],
        }),
      },
      {
        translateY: pressValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3 * motionParallaxScale],
        }),
      },
    ],
  };
  const badgeMotion = {
    transform: [
      {
        scale: selectedPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.09],
        }),
      },
    ],
  };

  function handlePressIn() {
    Animated.timing(pressValue, {
      toValue: 1,
      duration: Math.max(90, Math.round(120 * motionDurationScale)),
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.timing(pressValue, {
      toValue: 0,
      duration: Math.max(100, Math.round(170 * motionDurationScale)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={[{ width: cardWidth }, cardMotion]}>
      <Pressable
        key={item.id}
        onPress={() => onToggle(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, selected ? styles.cardSelected : styles.cardDefault]}
      >
        <View style={styles.imageWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, imageParallax]}>
            {/* Always render the gradient as the base layer (fallback / loading background). */}
            <LinearGradient colors={gradientColors as [string, string]} style={StyleSheet.absoluteFill} />
            {item.imageUrl && !imageFailed ? (
              <>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onLoadEnd={() => setIsLoading(false)}
                  onError={() => {
                    setImageFailed(true);
                    setIsLoading(false);
                  }}
                />
                {isLoading ? (
                  <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                    <ActivityIndicator size="small" color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)"} />
                  </View>
                ) : null}
              </>
            ) : null}
          </Animated.View>
          {item.families?.[0] ? (
            <View style={styles.familyPill}>
              <Text style={styles.familyText}>{item.families[0]}</Text>
            </View>
          ) : null}
          <Animated.View style={[styles.selectionBadge, selected && styles.selectionBadgeActive, badgeMotion]}>
            <Text style={[styles.selectionMark, selected && styles.selectionMarkActive]}>
              {selected ? "✓" : "+"}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.concentration, item.year].filter(Boolean).join(" · ")}
          </Text>
          {descriptor ? (
            <Text style={styles.descriptor} numberOfLines={2}>
              {descriptor}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SelectablePerfumeGrid({
  perfumes,
  selectedIds,
  onToggle,
}: {
  perfumes: Perfume[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const motion = useMotionProfile();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const cardWidth = (width - 52) / 2;

  return (
    <View style={styles.grid}>
      {perfumes.map((item, index) => (
        <PerfumeCard
          key={item.id}
          item={item}
          index={index}
          cardWidth={cardWidth}
          selected={selectedIds.includes(item.id)}
          onToggle={onToggle}
          colors={colors}
          isDark={isDark}
          styles={styles}
          motionDurationScale={motion.durationScale}
          motionDistanceScale={motion.distanceScale}
          motionParallaxScale={motion.parallaxScale}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
    },
    cardDefault: {
      backgroundColor: colors.surface,
      borderColor: colors.borderLight,
    },
    cardSelected: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    imageWrap: {
      height: 176,
      position: "relative",
      backgroundColor: colors.surfaceMuted,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    loadingOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    familyPill: {
      position: "absolute",
      left: 10,
      bottom: 10,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: RADIUS.full,
      backgroundColor: isDark ? colors.glass : "rgba(255, 253, 249, 0.8)",
      borderWidth: 1,
      borderColor: isDark ? colors.glassBorder : "transparent",
    },
    familyText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 10,
      letterSpacing: 0.4,
      color: colors.ink,
      textTransform: "uppercase",
    },
    selectionBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 28,
      height: 28,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? colors.glass : "rgba(255, 253, 249, 0.82)",
      borderWidth: 1,
      borderColor: isDark ? colors.glassBorder : "rgba(26, 23, 20, 0.08)",
    },
    selectionBadgeActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    selectionMark: {
      fontFamily: FONTS.sansBold,
      fontSize: 14,
      color: colors.inkMid,
    },
    selectionMarkActive: {
      color: colors.accentForeground,
    },
    body: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 16,
      gap: 4,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 18,
      lineHeight: 21,
      color: colors.ink,
    },
    brand: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.ink,
    },
    meta: {
      fontFamily: FONTS.sans,
      fontSize: 11,
      letterSpacing: 0.5,
      color: colors.inkFaint,
      textTransform: "uppercase",
    },
    descriptor: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 17,
      color: colors.inkMid,
    },
  });
