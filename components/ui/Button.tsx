import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";

type ButtonVariant = "primary" | "secondary" | "ghost" | "copper";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "sm" | "md";
}

export function Button({
  title,
  variant = "primary",
  loading,
  style,
  disabled,
  size = "md",
  ...props
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const isDisabled = loading || disabled;
  const dynamicStyles = createStyles(colors, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        dynamicStyles.base,
        size === "sm" && dynamicStyles.sm,
        variant === "primary" && dynamicStyles.primary,
        variant === "secondary" && dynamicStyles.secondary,
        variant === "ghost" && dynamicStyles.ghost,
        variant === "copper" && dynamicStyles.copper,
        pressed && !isDisabled && dynamicStyles.pressed,
        isDisabled && dynamicStyles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "copper"
              ? colors.accentForeground
              : colors.ink
          }
        />
      ) : (
        <Text
          style={[
            dynamicStyles.label,
            size === "sm" && dynamicStyles.labelSm,
            variant === "primary" || variant === "copper"
              ? dynamicStyles.lightLabel
              : dynamicStyles.darkLabel,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    base: {
      minHeight: 54,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xxl,
    },
    sm: {
      minHeight: 42,
      paddingHorizontal: SPACING.xl,
    },
    primary: {
      backgroundColor: colors.ink,
    },
    copper: {
      backgroundColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
    disabled: {
      opacity: 0.45,
    },
    label: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 15,
      letterSpacing: 0.1,
    },
    labelSm: {
      fontSize: 13,
    },
    lightLabel: {
      color: variantTextColor(isDark, colors),
    },
    darkLabel: {
      color: colors.ink,
    },
  });

function variantTextColor(
  isDark: boolean,
  colors: ReturnType<typeof useTheme>["colors"],
) {
  return isDark ? colors.bg : colors.accentForeground;
}
