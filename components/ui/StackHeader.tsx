import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS } from "@/utils/constants";
import { TabBarIcon } from "@/components/ui/TabBarIcon";

interface StackHeaderProps {
  title?: string;
  subtitle?: string;
  light?: boolean;
  absolute?: boolean;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
}

export function StackHeader({
  title,
  subtitle,
  light = false,
  absolute = false,
  onBack,
  rightLabel,
  onRightPress,
}: StackHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const textColor = light ? "#FFFDF9" : colors.ink;
  const subColor = light ? "rgba(255,255,255,0.68)" : colors.inkMid;
  const borderColor = light ? "rgba(255,255,255,0.18)" : colors.glassBorder;
  const surface = light ? "rgba(22,18,15,0.22)" : colors.glass;

  return (
    <View style={[styles.row, absolute && styles.absolute]}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={[styles.iconButton, { borderColor, backgroundColor: surface }]}
        hitSlop={10}
      >
        <TabBarIcon name="chevron-left" color={textColor} size={18} focused={light} />
      </Pressable>

      <View style={styles.copy}>
        {subtitle ? <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text> : null}
        {title ? <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text> : null}
      </View>

      {rightLabel ? (
        <Pressable onPress={onRightPress} hitSlop={10} style={styles.rightButton}>
          <Text style={[styles.rightLabel, { color: textColor }]}>{rightLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  copy: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },
  subtitle: {
    fontFamily: FONTS.sansMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 15,
  },
  rightButton: {
    minWidth: 40,
    alignItems: "flex-end",
  },
  rightLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
  },
  rightSpacer: {
    width: 40,
  },
});
