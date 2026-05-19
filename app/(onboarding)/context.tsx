import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { FONTS, RADIUS, SPACING, USAGE_CONTEXTS } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import type { IntensityPreference } from "@/utils/types";

export default function ContextScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const usageContexts = useOnboardingStore((s) => s.usageContexts);
  const intensityPreference = useOnboardingStore((s) => s.intensityPreference);
  const toggleContext = useOnboardingStore((s) => s.toggleContext);
  const setIntensityPreference = useOnboardingStore((s) => s.setIntensityPreference);
  const canContinue = usageContexts.length >= 1 && !!intensityPreference;

  const contextLabel = (key: typeof USAGE_CONTEXTS[number]["key"]) => {
    const map: Record<typeof USAGE_CONTEXTS[number]["key"], string> = {
      "Daily": t("onboarding.context.labelDaily"),
      "Office": t("onboarding.context.labelOffice"),
      "Date Night": t("onboarding.context.labelDateNight"),
      "Night Out": t("onboarding.context.labelNightOut"),
      "Sport": t("onboarding.context.labelSport"),
      "Special": t("onboarding.context.labelSpecial"),
    };
    return map[key];
  };

  const INTENSITY_OPTIONS: { value: IntensityPreference; label: string; description: string }[] = [
    { value: "light", label: t("onboarding.context.intensityLight"), description: t("onboarding.context.intensityLightDesc") },
    { value: "moderate", label: t("onboarding.context.intensityModerate"), description: t("onboarding.context.intensityModerateDesc") },
    { value: "strong", label: t("onboarding.context.intensityStrong"), description: t("onboarding.context.intensityStrongDesc") },
  ];

  return (
    <OnboardingShell
      step={6}
      stepLabel={t("onboarding.context.stepLabel")}
      title={<Text style={styles.screenTitle}>{t("onboarding.context.titleA")}{"\n"}<Text style={styles.screenTitleAccent}>{t("onboarding.context.titleB")}</Text></Text>}
      subtitle={<Text style={styles.screenSubtitle}>{t("onboarding.context.subtitle")}</Text>}
      canContinue={canContinue}
      onContinue={() => router.push("/(onboarding)/budget")}
    >
      <View style={styles.contextGrid}>
        {USAGE_CONTEXTS.map((context) => {
          const selected = usageContexts.includes(context.key);
          return (
            <Pressable key={context.key} style={[styles.contextCard, selected ? styles.contextCardSelected : styles.contextCardDefault]} onPress={() => toggleContext(context.key)}>
              <Text style={styles.contextIcon}>{context.icon}</Text>
              <Text style={styles.contextLabel}>{contextLabel(context.key)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionHeading}>{t("onboarding.context.scentIntensity")}</Text>
      <View style={styles.intensityRow}>
        {INTENSITY_OPTIONS.map((option) => {
          const selected = intensityPreference === option.value;
          return (
            <Pressable key={option.value} style={[styles.intensityCard, selected ? styles.intensityCardSelected : styles.intensityCardDefault]} onPress={() => setIntensityPreference(option.value)}>
              <Text style={styles.intensityLabel}>{option.label}</Text>
              <Text style={styles.intensityDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  contextGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
  screenTitle: { fontFamily: FONTS.serif, fontSize: 34, lineHeight: 36, letterSpacing: -0.8, color: colors.ink },
  screenTitleAccent: { color: colors.accent, fontStyle: "italic" },
  screenSubtitle: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 22, color: colors.inkMid },
  contextCard: {
    width: "48%",
    minHeight: 92,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  contextCardDefault: { backgroundColor: colors.surface, borderColor: colors.border },
  contextCardSelected: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  contextIcon: { fontSize: 28 },
  contextLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: colors.ink, textAlign: "center" },
  sectionHeading: { fontFamily: FONTS.sansSemiBold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: colors.inkMid },
  intensityRow: { flexDirection: "row", gap: SPACING.sm },
  intensityCard: { flex: 1, padding: 16, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: "center", gap: SPACING.xs },
  intensityCardDefault: { backgroundColor: colors.surface, borderColor: colors.border },
  intensityCardSelected: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  intensityLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: colors.ink, textAlign: "center" },
  intensityDescription: { fontFamily: FONTS.sans, fontSize: 12, color: colors.inkFaint, textAlign: "center" },
});
