import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useScanStore } from "@/stores/useScanStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";

interface Props {
  label?: string;
  style?: object;
}

export function ScanCTA({ label = "Parfümünü Tarat", style }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const reset = useScanStore((s) => s.reset);

  const handlePress = () => {
    reset();
    router.push("/(scan)/capture");
  };

  return (
    <Pressable
      style={[styles.btn, { backgroundColor: colors.accentLight, borderColor: colors.accent }, style]}
      onPress={handlePress}
    >
      <Text style={styles.icon}>📷</Text>
      <View>
        <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
        <Text style={[styles.sub, { color: colors.inkFaint }]}>Fotoğraf çek veya seç</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  icon: { fontSize: 28 },
  label: { fontFamily: FONTS.sansSemiBold, fontSize: 15 },
  sub: { fontFamily: FONTS.sans, fontSize: 12, marginTop: 1 },
});
