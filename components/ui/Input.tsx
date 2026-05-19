import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";

export function Input(props: TextInputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TextInput placeholderTextColor={colors.text3} style={styles.input} {...props} />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.lg,
    },
    input: {
      minHeight: 52,
      fontFamily: FONTS.sans,
      color: colors.text1,
      fontSize: 14,
    },
  });
