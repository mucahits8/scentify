import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { BUDGET_OPTIONS, FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function BudgetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const budgetPreference = useOnboardingStore((s) => s.budgetPreference);
  const setBudgetPreference = useOnboardingStore((s) => s.setBudgetPreference);

  return (
    <OnboardingShell
      step={7}
      stepLabel={t("onboarding.budget.stepLabel")}
      title={<Text style={styles.screenTitle}>{t("onboarding.budget.titleA")}{"\n"}<Text style={styles.screenTitleAccent}>{t("onboarding.budget.titleB")}</Text></Text>}
      subtitle={<Text style={styles.screenSubtitle}>{t("onboarding.budget.subtitle")}</Text>}
      canContinue={!!budgetPreference}
      onContinue={() => router.push("/(onboarding)/weather")}
    >
      <View style={styles.stack}>
        {BUDGET_OPTIONS.map((option) => {
          const selected = budgetPreference === option.value;
          return (
            <Pressable key={option.value} style={[styles.card, selected ? styles.cardSelected : styles.cardDefault]} onPress={() => setBudgetPreference(option.value)}>
              <Text style={styles.dollarLabel}>{option.label}</Text>
              <View style={styles.copy}>
                <Text style={styles.description}>{t(`onboarding.budget.${option.value}`)}</Text>
                <Text style={styles.range}>{option.range}</Text>
              </View>
              <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
                {selected ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  stack: { gap: 10 },
  screenTitle: { fontFamily: FONTS.serif, fontSize: 34, lineHeight: 36, letterSpacing: -0.8, color: colors.ink },
  screenTitleAccent: { color: colors.accent, fontStyle: "italic" },
  screenSubtitle: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 22, color: colors.inkMid },
  card: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, gap: SPACING.lg },
  cardDefault: { backgroundColor: colors.surface, borderColor: colors.border },
  cardSelected: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  dollarLabel: { fontFamily: FONTS.serif, fontSize: 28, color: colors.ink, width: 44 },
  copy: { flex: 1, gap: 3 },
  description: { fontFamily: FONTS.sansMedium, fontSize: 15, color: colors.ink },
  range: { fontFamily: FONTS.sans, fontSize: 13, color: colors.inkFaint },
  checkCircle: { width: 28, height: 28, borderRadius: RADIUS.full, borderWidth: 1.5, backgroundColor: colors.surface, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkCircleSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { fontFamily: FONTS.sansBold, fontSize: 14, color: colors.accentForeground, lineHeight: 18 },
});
