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

export default function DislikeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const dislikedPerfumeIds = useOnboardingStore((s) => s.dislikedPerfumeIds);
  const toggleDisliked = useOnboardingStore((s) => s.toggleDisliked);
  const { loading, perfumes } = useOnboardingCatalog(query);

  return (
    <OnboardingShell
      step={3}
      stepLabel={t("onboarding.dislike.stepLabel")}
      title={
        <Text style={styles.title}>
          {t("onboarding.dislike.titleA")}{"\n"}
          <Text style={styles.titleAccent}>{t("onboarding.dislike.titleB")}</Text>
        </Text>
      }
      subtitle={
        <Text style={styles.subtitle}>{t("onboarding.dislike.subtitle")}</Text>
      }
      canContinue={perfumes.length > 0}
      onContinue={() => router.push("/(onboarding)/owned")}
    >
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{dislikedPerfumeIds.length} {t("onboarding.selectedCount")}</Text>
        <Text style={styles.metaHint}>{t("onboarding.dislike.hint")}</Text>
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
          <Text style={styles.loadingText}>{t("onboarding.dislike.loading")}</Text>
        </View>
      ) : (
        perfumes.length > 0 ? (
          <SelectablePerfumeGrid perfumes={perfumes} selectedIds={dislikedPerfumeIds} onToggle={toggleDisliked} />
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
