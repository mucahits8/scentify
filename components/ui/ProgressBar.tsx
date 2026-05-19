import { StyleSheet, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { RADIUS } from "@/utils/constants";

export function ProgressBar({ progress }: { progress: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    track: {
      height: 6,
      width: "100%",
      backgroundColor: colors.borderLight,
      borderRadius: RADIUS.full,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: RADIUS.full,
    },
  });
