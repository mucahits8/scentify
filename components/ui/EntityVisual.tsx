import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { EditorialVisual } from "@/components/ui/EditorialVisual";

export function EntityVisual({
  imageUrl,
  label,
  tone = "ink",
  height,
}: {
  imageUrl?: string | null;
  label: string;
  tone?: "warm" | "ink" | "sand" | "rose";
  height: number;
}) {
  const { isDark } = useTheme();
  const [failed, setFailed] = useState(false);

  const showImage = Boolean(imageUrl) && !failed;

  return (
    <View style={[styles.wrap, { height }]}>
      {showImage ? (
        <Image source={{ uri: imageUrl as string }} resizeMode="cover" style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      ) : (
        <EditorialVisual label={label} tone={tone} height={height} />
      )}
      <View style={[styles.veil, isDark ? styles.veilDark : styles.veilLight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    position: "relative",
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
  veilDark: {
    backgroundColor: "rgba(12,10,8,0.14)",
  },
  veilLight: {
    backgroundColor: "rgba(255,253,249,0.06)",
  },
});
