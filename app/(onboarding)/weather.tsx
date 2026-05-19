import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { requestWeatherPermission } from "@/services/weather";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { FONTS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function WeatherScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const onboarding = useOnboardingStore();

  const WEATHER_FEATURES = [
    t("onboarding.weather.features.morning"),
    t("onboarding.weather.features.rainy"),
    t("onboarding.weather.features.summer"),
  ];

  const handleContinue = async () => {
    await requestWeatherPermission();
    onboarding.setWeatherEnabled(true);
    router.push("/(onboarding)/pro");
  };

  return (
    <OnboardingShell
      step={8}
      stepLabel={t("onboarding.weather.stepLabel")}
      title={<Text style={styles.screenTitle}>{t("onboarding.weather.titleA")}{"\n"}<Text style={styles.screenTitleAccent}>{t("onboarding.weather.titleB")}</Text></Text>}
      subtitle={<Text style={styles.screenSubtitle}>{t("onboarding.weather.subtitle")}</Text>}
      canContinue
      onContinue={handleContinue}
      showSkip
      onSkip={() => {
        onboarding.setWeatherEnabled(false);
        router.push("/(onboarding)/pro");
      }}
      continueLabel={t("onboarding.weather.enableWeather")}
    >
      <View style={styles.illustrationRow}>
        <View style={styles.iconCircle}>
          <TabBarIcon name="sparkle" color={colors.accent} size={32} focused />
        </View>
      </View>

      <View style={styles.featuresList}>
        {WEATHER_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  screenTitle: { fontFamily: FONTS.serif, fontSize: 34, lineHeight: 36, letterSpacing: -0.8, color: colors.ink },
  screenTitleAccent: { color: colors.accent, fontStyle: "italic" },
  screenSubtitle: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 22, color: colors.inkMid },
  illustrationRow: { alignItems: "center", paddingVertical: SPACING.xl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accentLight, alignItems: "center", justifyContent: "center" },
  featuresList: { gap: SPACING.lg },
  featureRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  featureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  featureText: { fontFamily: FONTS.sansMedium, fontSize: 14, color: colors.ink, flex: 1 },
});
