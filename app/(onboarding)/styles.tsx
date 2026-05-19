import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Chip } from "@/components/ui/Chip";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { AVOID_NOTES, FONTS, SCENT_STYLES, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function StylesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const preferredStyles = useOnboardingStore((s) => s.preferredStyles);
  const avoidNotes = useOnboardingStore((s) => s.avoidNotes);
  const toggleStyle = useOnboardingStore((s) => s.toggleStyle);
  const toggleAvoidNote = useOnboardingStore((s) => s.toggleAvoidNote);

  return (
    <OnboardingShell
      step={5}
      stepLabel={t("onboarding.styles.stepLabel")}
      title={
        <Text style={styles.screenTitle}>
          {t("onboarding.styles.titleA")}{"\n"}
          <Text style={styles.screenTitleAccent}>{t("onboarding.styles.titleB")}</Text>
        </Text>
      }
      subtitle={
        <Text style={styles.screenSubtitle}>
          {t("onboarding.styles.subtitle")}
        </Text>
      }
      canContinue={true}
      onContinue={() => router.push("/(onboarding)/context")}
    >
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>{t("onboarding.styles.preferredStyles")}</Text>
        <View style={styles.chipRow}>
          {SCENT_STYLES.map((style) => (
            <Chip
              key={style}
              label={style}
              selected={preferredStyles.includes(style)}
              onPress={() => toggleStyle(style)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>{t("onboarding.styles.notesToSkip")}</Text>
        <View style={styles.chipRow}>
          {AVOID_NOTES.map((note) => (
            <Chip
              key={note}
              label={note}
              tone="muted"
              selected={avoidNotes.includes(note)}
              onPress={() => toggleAvoidNote(note)}
            />
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  section: {
    gap: SPACING.md,
  },
  screenTitle: {
    fontFamily: FONTS.serif,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  screenTitleAccent: {
    color: colors.accent,
    fontStyle: "italic",
  },
  screenSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMid,
  },
  sectionHeading: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.inkMid,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
});
