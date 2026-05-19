import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FAMILY_GRADIENTS, FONTS, RADIUS } from "@/utils/constants";
import type { Perfume } from "@/utils/types";

type PerfumeVisualVariant = "card" | "hero" | "thumb";

function genderAccent(gender: Perfume["gender"]) {
  if (gender === "women") return "#D7A0AD";
  if (gender === "men") return "#7C9CB8";
  return "#9FB58D";
}

function genderLabel(gender: Perfume["gender"]) {
  if (gender === "women") return "FEMME";
  if (gender === "men") return "HOMME";
  return "UNISEX";
}

export function PerfumeVisual({
  perfume,
  height,
  variant = "card",
}: {
  perfume: Perfume;
  height: number;
  variant?: PerfumeVisualVariant;
}) {
  const { isDark } = useTheme();
  const family = perfume.families?.[0] ?? "Default";
  const palette = FAMILY_GRADIENTS[family] ?? FAMILY_GRADIENTS.Default;
  const accent = genderAccent(perfume.gender);
  const isHero = variant === "hero";
  const isThumb = variant === "thumb";

  return (
    <View style={[styles.wrap, { height }, isHero && styles.heroWrap, isThumb && styles.thumbWrap]}>
      <LinearGradient
        colors={isDark ? ["#2B241F", "#14100D"] : palette}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.wash, { backgroundColor: `${accent}30` }]} />
      <View style={[styles.ring, isHero && styles.heroRing, { borderColor: `${accent}70` }]} />
      <View style={[styles.bottleShadow, isHero && styles.heroBottleShadow]} />
      <View style={[styles.bottle, isHero && styles.heroBottle, isThumb && styles.thumbBottle]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.92)", `${accent}CC`, "rgba(28,20,16,0.78)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
        <View style={styles.cap} />
        <View style={styles.labelPlate}>
          <Text style={styles.brandText} numberOfLines={1}>{perfume.brand}</Text>
          <Text style={styles.genderText}>{genderLabel(perfume.gender)}</Text>
        </View>
      </View>
      {!isThumb ? (
        <View style={styles.familyPlate}>
          <Text style={styles.familyText} numberOfLines={1}>{family}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.lg,
  },
  heroWrap: {
    borderRadius: 0,
  },
  thumbWrap: {
    borderRadius: 14,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    opacity: 0.8,
  },
  heroRing: {
    width: 230,
    height: 230,
    borderRadius: 115,
  },
  bottleShadow: {
    position: "absolute",
    bottom: 28,
    width: 86,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(18,12,8,0.18)",
  },
  heroBottleShadow: {
    bottom: 64,
    width: 138,
    height: 22,
  },
  bottle: {
    width: 70,
    height: 108,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,248,241,0.58)",
  },
  heroBottle: {
    width: 118,
    height: 178,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  thumbBottle: {
    width: 46,
    height: 70,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cap: {
    alignSelf: "center",
    width: "38%",
    height: 12,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: "rgba(24,17,13,0.48)",
  },
  labelPlate: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 12,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 5,
    backgroundColor: "rgba(255,248,241,0.72)",
    alignItems: "center",
    gap: 1,
  },
  brandText: {
    fontFamily: FONTS.sansBold,
    fontSize: 8,
    color: "#231A15",
    textTransform: "uppercase",
  },
  genderText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 7,
    color: "rgba(35,26,21,0.62)",
  },
  familyPlate: {
    position: "absolute",
    left: 10,
    bottom: 10,
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "rgba(255,248,241,0.74)",
  },
  familyText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    color: "#241A14",
  },
});
