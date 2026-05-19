import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Card } from "@/components/ui/Card";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function OnboardingProScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setPremium = useSubscriptionStore((s) => s.setPremium);
  const setPaywallShown = useSubscriptionStore((s) => s.setPaywallShown);

  async function finish(isPremium: boolean) {
    if (isPremium) {
      setPremium(true);
      setPaywallShown(true);
    }

    // Read onboarding state at call time rather than subscribing to the whole store.
    const {
      genderPreference,
      budgetPreference,
      intensityPreference,
      usageContexts,
      weatherEnabled,
      lovedPerfumeIds,
      dislikedPerfumeIds,
      ownedPerfumeIds,
      preferredStyles,
      avoidNotes,
      catalogPerfumes,
    } = useOnboardingStore.getState();

    await completeOnboarding({
      genderPreference,
      budgetPreference,
      intensityPreference,
      usageContexts,
      weatherEnabled,
      lovedIds: lovedPerfumeIds,
      dislikedIds: dislikedPerfumeIds,
      ownedIds: ownedPerfumeIds,
      preferredStyles,
      avoidNotes,
      catalogPerfumes,
    });

    // Explicit navigation prevents relying on the onboarding layout's Redirect,
    // which can race with the navigation container mount state.
    router.replace("/dna/result" as never);
  }

  return (
    <OnboardingShell
      step={9}
      stepLabel={t("onboarding.pro.stepLabel")}
      title={
        <Text style={styles.title}>
          {t("onboarding.pro.titleA")}{"\n"}
          <Text style={styles.titleAccent}>{t("onboarding.pro.titleB")}</Text>
        </Text>
      }
      subtitle={<Text style={styles.subtitle}>{t("onboarding.pro.subtitle")}</Text>}
      canContinue
      onContinue={() => void finish(true)}
      continueLabel={t("onboarding.pro.ctaPrimary")}
      showSkip
      onSkip={() => {
        void finish(false);
      }}
    >
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <TabBarIcon name="sparkle" color={colors.accent} size={30} focused />
        </View>
      </View>

      <View style={styles.planStack}>
        <Card variant="dark" style={styles.weeklyCard}>
          <Text style={styles.planBadge}>WEEKLY</Text>
          <Text style={styles.planTitle}>{t("onboarding.pro.weeklyTitle")}</Text>
          <Text style={styles.planMeta}>{t("onboarding.pro.weeklyMeta")}</Text>
          <Text style={styles.planPrice}>$5.99 / week</Text>
        </Card>

        <Card variant="tinted" style={styles.annualCard}>
          <View style={styles.annualHeader}>
            <Text style={styles.planBadgeAccent}>ANNUAL</Text>
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>Save 90%</Text>
            </View>
          </View>
          <Text style={styles.planTitleLight}>{t("onboarding.pro.yearlyTitle")}</Text>
          <Text style={styles.planMetaLight}>{t("onboarding.pro.yearlyMeta")}</Text>
          <Text style={styles.planPriceLight}>$29.99 / year</Text>
        </Card>
      </View>

      <Pressable style={styles.secondaryCta} onPress={() => void finish(false)}>
        <Text style={styles.secondaryCtaText}>{t("onboarding.pro.ctaSecondary")}</Text>
      </Pressable>
    </OnboardingShell>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  title: {
    fontFamily: FONTS.serif,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  titleAccent: {
    color: colors.accent,
    fontStyle: "italic",
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMid,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 4,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentLight,
  },
  planStack: {
    gap: SPACING.md,
  },
  weeklyCard: {
    gap: 8,
    paddingVertical: SPACING.xl,
  },
  annualCard: {
    gap: 8,
    paddingVertical: SPACING.xl,
  },
  annualHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planBadge: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.accentLight,
  },
  planBadgeAccent: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.accent,
  },
  planTitle: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: colors.accentForeground,
  },
  planMeta: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: colors.accentForeground,
    opacity: 0.92,
  },
  planPrice: {
    marginTop: 2,
    fontFamily: FONTS.sansSemiBold,
    fontSize: 16,
    color: colors.accentForeground,
  },
  planTitleLight: {
    fontFamily: FONTS.serif,
    fontSize: 26,
    color: colors.ink,
  },
  planMetaLight: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: colors.inkMid,
  },
  planPriceLight: {
    marginTop: 2,
    fontFamily: FONTS.sansSemiBold,
    fontSize: 16,
    color: colors.ink,
  },
  savePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: colors.successBg,
  },
  savePillText: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    color: colors.success,
  },
  secondaryCta: {
    alignSelf: "center",
    paddingVertical: 6,
  },
  secondaryCtaText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: colors.inkMid,
  },
});
