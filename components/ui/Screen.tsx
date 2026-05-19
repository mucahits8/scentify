import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { SPACING } from "@/utils/constants";

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  noPadding?: boolean;
  bg?: string;
}

export function Screen({
  children,
  style,
  scroll,
  scrollProps,
  noPadding,
  bg,
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  const safeStyle = [styles.safe, { backgroundColor: bg ?? colors.bg }];

  if (scroll) {
    return (
      <SafeAreaView style={safeStyle}>
        <ScrollView
          contentContainerStyle={[
            noPadding ? styles.scrollNoPad : styles.scrollContent,
            style,
          ]}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          <View {...props}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyle}>
      <View
        style={[noPadding ? styles.noPad : styles.content, style]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  noPad: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.section,
    gap: SPACING.xl,
  },
  scrollNoPad: {
    gap: SPACING.xl,
    paddingBottom: SPACING.section,
  },
});
