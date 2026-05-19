import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, SPACING } from "@/utils/constants";

export function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    wrap: {
      gap: SPACING.sm,
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      color: colors.accent,
      letterSpacing: 2.2,
      textTransform: "uppercase",
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 30,
      color: colors.text1,
    },
    subtitle: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 22,
      color: colors.text2,
    },
  });
