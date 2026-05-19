import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import type { GenderPreference } from "@/utils/types";

const GENDER_OPTIONS: { value: GenderPreference }[] = [
  { value: "men" },
  { value: "women" },
  { value: "all" },
];

export default function GenderScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const genderPreference = useOnboardingStore((s) => s.genderPreference);
  const setGenderPreference = useOnboardingStore((s) => s.setGenderPreference);

  return (
    <OnboardingShell
      step={1}
      stepLabel={t("onboarding.gender.stepLabel")}
      title={<Text style={styles.screenTitle}>{t("onboarding.gender.titleA")}{"\n"}<Text style={styles.screenTitleAccent}>{t("onboarding.gender.titleB")}</Text></Text>}
      subtitle={<Text style={styles.screenSubtitle}>{t("onboarding.gender.subtitle")}</Text>}
      canContinue={!!genderPreference}
      onContinue={() => router.push("/(onboarding)/love")}
    >
      <View style={styles.cardStack}>
        {GENDER_OPTIONS.map((option) => {
          const selected = genderPreference === option.value;
          const symbol = option.value === "men" ? "M" : option.value === "women" ? "W" : "A";
          const localizedLabel =
            option.value === "men"
              ? t("onboarding.gender.forHim")
              : option.value === "women"
                ? t("onboarding.gender.forHer")
                : t("onboarding.gender.unisex");
          const localizedDescription =
            option.value === "men"
              ? t("onboarding.gender.descMen")
              : option.value === "women"
                ? t("onboarding.gender.descWomen")
                : t("onboarding.gender.descUnisex");
          return (
            <Pressable key={option.value} style={[styles.card, selected ? styles.cardSelected : styles.cardDefault]} onPress={() => setGenderPreference(option.value)}>
              <View style={[styles.symbol, selected && styles.symbolSelected]}>
                <Text style={[styles.symbolText, selected && styles.symbolTextSelected]}>{symbol}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel}>{localizedLabel}</Text>
                <Text style={styles.cardDescription}>{localizedDescription}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  cardStack: { gap: 10 },
  screenTitle: { fontFamily: FONTS.serif, fontSize: 38, lineHeight: 40, color: colors.ink },
  screenTitleAccent: { color: colors.accent, fontStyle: "italic" },
  screenSubtitle: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 22, color: colors.inkMid },
  card: {
    minHeight: 98,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  cardDefault: { backgroundColor: colors.surface, borderColor: colors.border },
  cardSelected: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  symbol: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  symbolSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  symbolText: {
    fontFamily: FONTS.sansBold,
    fontSize: 15,
    color: colors.inkMid,
  },
  symbolTextSelected: {
    color: colors.accentForeground,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardLabel: { fontFamily: FONTS.serif, fontSize: 24, color: colors.ink },
  cardDescription: { fontFamily: FONTS.sans, fontSize: 13, lineHeight: 18, color: colors.inkMid },
});
