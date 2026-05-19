import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, RADIUS } from "@/utils/constants";

type EditorialVisualTone = "warm" | "ink" | "sand" | "rose";

export function EditorialVisual({
  label,
  tone = "warm",
  height = 120,
}: {
  label: string;
  tone?: EditorialVisualTone;
  height?: number;
}) {
  const { isDark } = useTheme();
  const palette: [string, string] =
    tone === "ink"
      ? ["#2B231D", "#171311"]
      : tone === "sand"
        ? ["#CBBEAA", "#A89A84"]
        : tone === "rose"
          ? ["#C9AA9B", "#A78477"]
          : ["#D8B48D", "#9B7252"];

  return (
    <View style={[styles.wrap, { height }]}>
      <LinearGradient colors={palette} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={[styles.veil, isDark && styles.veilDark]} />
      <View style={styles.target}>
        <View style={styles.targetDot} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,241,0.06)",
  },
  veilDark: {
    backgroundColor: "rgba(255,248,241,0.04)",
  },
  target: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: "rgba(255,248,241,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  targetDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFF8F1",
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: "rgba(255,248,241,0.78)",
    letterSpacing: 0.4,
  },
});
