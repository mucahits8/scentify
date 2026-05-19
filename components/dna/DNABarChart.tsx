import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { topDimensions } from "@/utils/helpers";
import type { ScentDNAProfile } from "@/utils/types";

export function DNABarChart({ profile }: { profile: ScentDNAProfile }) {
  const items = topDimensions(profile, 8);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <Text style={styles.label}>{item.key}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${item.value}%`,
                  backgroundColor: colors.dna[item.key],
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      gap: SPACING.md,
    },
    row: {
      gap: SPACING.sm,
    },
    label: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.text2,
      textTransform: "capitalize",
    },
    track: {
      height: 10,
      backgroundColor: colors.surfaceAlt,
      borderRadius: RADIUS.full,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: RADIUS.full,
    },
    value: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.text1,
    },
  });
