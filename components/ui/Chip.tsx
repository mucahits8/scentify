import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";

interface ChipProps {
  label: string;
  selected?: boolean;
  tone?: "accent" | "muted" | "success" | "ink";
  size?: "sm" | "md";
  onPress?: () => void;
}

export function Chip({
  label,
  selected,
  tone = "accent",
  size = "md",
  onPress,
}: ChipProps) {
  const { colors, isDark } = useTheme();
  const palette =
    tone === "muted"
      ? { border: colors.muted, bg: colors.mutedBg, text: colors.muted }
      : tone === "success"
      ? { border: colors.success, bg: colors.successBg, text: colors.success }
      : tone === "ink"
      ? { border: colors.ink, bg: colors.ink, text: isDark ? colors.bg : colors.surface }
      : { border: colors.accent, bg: colors.accentLight, text: colors.accentDark };

  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        size === "sm" && styles.chipSm,
        selected && {
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          size === "sm" && styles.labelSm,
          selected && { color: palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
    },
    chipSm: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs + 1,
    },
    label: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkMid,
    },
    labelSm: {
      fontSize: 11,
    },
  });
