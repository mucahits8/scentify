import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

import { SelectablePerfumeGrid } from "@/components/onboarding/SelectablePerfumeGrid";
import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingCatalog } from "@/components/onboarding/useOnboardingCatalog";
import { ScanCTA } from "@/components/scan/ScanCTA";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { FONTS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function OwnedScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const ownedPerfumeIds = useOnboardingStore((s) => s.ownedPerfumeIds);
  const toggleOwned = useOnboardingStore((s) => s.toggleOwned);
  const { loading, perfumes } = useOnboardingCatalog(query);

  const handleContinue = () => router.push("/(onboarding)/styles");

  return (
    <OnboardingShell
      step={4}
      stepLabel={t("onboarding.owned.stepLabel")}
      title={
        <Text style={styles.title}>
          {t("onboarding.owned.titleA")}{"\n"}
          <Text style={styles.titleAccent}>{t("onboarding.owned.titleB")}</Text>
        </Text>
      }
      subtitle={
        <Text style={styles.subtitle}>{t("onboarding.owned.subtitle")}</Text>
      }
      canContinue={true}
      onContinue={handleContinue}
      showSkip
      onSkip={handleContinue}
    >
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{ownedPerfumeIds.length} {t("onboarding.selectedCount")}</Text>
        <Text style={styles.metaHint}>{t("onboarding.owned.hint")}</Text>
      </View>
      <ScanCTA label="Parfümünü Tarat" style={styles.scanCta} />
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("onboarding.searchPlaceholder")}
          placeholderTextColor={colors.inkFaint}
          style={styles.searchInput}
        />
      </View>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>{t("onboarding.owned.loading")}</Text>
        </View>
      ) : (
        perfumes.length > 0 ? (
          <SelectablePerfumeGrid perfumes={perfumes} selectedIds={ownedPerfumeIds} onToggle={toggleOwned} />
        ) : (
          <Text style={styles.emptyText}>{t("onboarding.noResults")}</Text>
        )
      )}
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
  metaRow: {
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  metaHint: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMid,
  },
  scanCta: {
    marginBottom: SPACING.sm,
  },
  searchWrap: {
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    minHeight: 46,
    paddingHorizontal: 14,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: colors.ink,
  },
  loadingState: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: colors.inkMid,
  },
  emptyText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: colors.inkMid,
  },
});
