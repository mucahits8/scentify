import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";

import { SelectablePerfumeGrid } from "@/components/onboarding/SelectablePerfumeGrid";
import { useTheme } from "@/components/theme/ThemeProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboardingCatalog } from "@/components/onboarding/useOnboardingCatalog";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { FONTS } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function LoveScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const lovedPerfumeIds = useOnboardingStore((s) => s.lovedPerfumeIds);
  const toggleLoved = useOnboardingStore((s) => s.toggleLoved);
  const { loading, perfumes } = useOnboardingCatalog(query);

  return (
    <OnboardingShell
      step={2}
      stepLabel={t("onboarding.love.stepLabel")}
      title={
        <Text style={styles.title}>
          {t("onboarding.love.titleA")}{"\n"}
          <Text style={styles.titleAccent}>{t("onboarding.love.titleB")}</Text>
        </Text>
      }
      subtitle={
        <Text style={styles.subtitle}>{t("onboarding.love.subtitle")}</Text>
      }
      canContinue={lovedPerfumeIds.length >= 3 && perfumes.length > 0}
      onContinue={() => router.push("/(onboarding)/dislike")}
    >
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{lovedPerfumeIds.length} {t("onboarding.selectedCount")}</Text>
        <Text style={styles.metaHint}>{t("onboarding.love.hint")}</Text>
      </View>
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
          <Text style={styles.loadingText}>{t("onboarding.love.loading")}</Text>
        </View>
      ) : (
        perfumes.length > 0 ? (
          <SelectablePerfumeGrid perfumes={perfumes} selectedIds={lovedPerfumeIds} onToggle={toggleLoved} />
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
