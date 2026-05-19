import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { PerfumeCard } from "@/components/perfume/PerfumeCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EntityVisual } from "@/components/ui/EntityVisual";
import { Screen } from "@/components/ui/Screen";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { getBrandBySlug, getPerfumesByBrandSlug } from "@/services/perfumes";
import { FONTS, RADIUS } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import { perfLog, perfNow } from "@/utils/perf";
import type { Brand, Perfume } from "@/utils/types";

type BrandTabKey = "all" | "family" | "gender" | "perfumers";

function brandQuote(name: string, language: "tr" | "en") {
  if (language === "tr") {
    return `"${name} heykelsi, rafine ve sessiz bir atmosfer kurar."`;
  }
  return `"${name} reads sculpted, composed, and quietly atmospheric."`;
}

export default function BrandDetailScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [activeTab, setActiveTab] = useState<BrandTabKey>("all");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = language === "tr"
    ? {
      loading: "Marka detayı yükleniyor…",
      notFound: "Marka bulunamadı",
      notFoundCopy: "Bu marka kaldırılmış veya yeniden adlandırılmış olabilir.",
      backToDiscover: "Keşfete Dön",
      unknown: "Bilinmiyor",
      defaultBrand: "Marka",
      quoteFallback: "Bu marka",
      statsPerfumes: "Parfümler",
      statsCreators: "Yaratıcılar",
      statsRating: "Ortalama puan",
      tabsAll: "Tüm işler",
      tabsFamily: "Aileye göre",
      tabsGender: "Cinsiyete göre",
      tabsCreators: "Yaratıcılar",
      signatureTerritories: "İmza alanları",
      works: "eser",
      seeAll: "Tümünü gör",
      centerLabel: "marka · görsel dünya",
    }
    : {
      loading: "Loading brand detail…",
      notFound: "Brand not found",
      notFoundCopy: "This house may have been removed or renamed.",
      backToDiscover: "Back to Discover",
      unknown: "Unknown",
      defaultBrand: "Brand",
      quoteFallback: "This house",
      statsPerfumes: "Perfumes",
      statsCreators: "Creators",
      statsRating: "Avg rating",
      tabsAll: "All works",
      tabsFamily: "By family",
      tabsGender: "By gender",
      tabsCreators: "Creators",
      signatureTerritories: "Signature territories",
      works: "works",
      seeAll: "See all",
      centerLabel: "brand · still life",
    };

  function safeBack() {
    const maybeCanGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    if (typeof maybeCanGoBack === "function" && maybeCanGoBack()) {
      router.back();
      return;
    }
    router.replace("/discover" as never);
  }

  const loadBrandDetail = useCallback(async () => {
    if (!slug) return;
    const startedAt = perfNow();
    setLoaded(false);
    setError(null);
    try {
      const [brandValue, perfumeValues] = await Promise.all([getBrandBySlug(slug), getPerfumesByBrandSlug(slug)]);
      setBrand(brandValue);
      setPerfumes(perfumeValues);
      perfLog("brand.loadDetail", startedAt, { perfumes: perfumeValues.length });
    } catch (err) {
      setBrand(null);
      setPerfumes([]);
      setError(err instanceof Error && err.message ? err.message : t("common.errorBody"));
      perfLog("brand.loadDetail.error", startedAt);
    } finally {
      setLoaded(true);
    }
  }, [slug, t]);

  useEffect(() => {
    void loadBrandDetail();
  }, [loadBrandDetail]);

  const familySections = useMemo(() => {
    const counts = new Map<string, Perfume[]>();
    perfumes.forEach((perfume) => {
      perfume.families.slice(0, 1).forEach((family) => {
        const current = counts.get(family) ?? [];
        counts.set(family, [...current, perfume]);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 4)
      .map(([title, items], index) => ({ title, items, index }));
  }, [perfumes]);

  const perfumersCount = new Set(perfumes.flatMap((perfume) => perfume.perfumers ?? [])).size;
  const avgRating =
    perfumes.length > 0
      ? Math.round((perfumes.reduce((sum, perfume) => sum + (perfume.ratingAvg ?? 0), 0) / perfumes.length) * 20)
      : 0;
  const visiblePerfumes = useMemo(() => {
    if (activeTab === "family") {
      return [...perfumes].sort((a, b) => (a.families[0] ?? "").localeCompare(b.families[0] ?? ""));
    }
    if (activeTab === "gender") {
      return [...perfumes].sort((a, b) => (a.gender ?? "").localeCompare(b.gender ?? ""));
    }
    if (activeTab === "perfumers") {
      return [...perfumes].sort((a, b) => (a.perfumers?.[0] ?? "").localeCompare(b.perfumers?.[0] ?? ""));
    }
    return perfumes;
  }, [activeTab, perfumes]);

  if (!loaded) {
    return (
      <Screen>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>{copy.loading}</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>{t("common.errorTitle")}</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Button title={t("common.retry")} variant="ghost" onPress={() => void loadBrandDetail()} />
        </View>
      </Screen>
    );
  }

  if (!brand && perfumes.length === 0) {
    return (
      <Screen>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>{copy.notFound}</Text>
          <Text style={styles.stateCopy}>{copy.notFoundCopy}</Text>
          <Pressable style={styles.stateButton} onPress={() => router.replace("/discover" as never)}>
            <Text style={styles.stateButtonText}>{copy.backToDiscover}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll noPadding>
      <View style={styles.hero}>
        <View style={StyleSheet.absoluteFill}>
          <EntityVisual imageUrl={brand?.heroImageUrl ?? brand?.imageUrl} label="brand · still life" tone="ink" height={284} />
        </View>
        <View style={styles.topBar}>
          <CircleAction icon="chevron-left" onPress={safeBack} />
          <CircleAction icon="dots" onPress={() => router.push(`/discover?tab=Brands&q=${encodeURIComponent(brand?.name ?? "")}` as never)} />
        </View>

        <View style={styles.heroCenterMark}>
          <View style={styles.heroTarget}>
            <View style={styles.heroTargetDot} />
          </View>
          <Text style={styles.heroCenterLabel}>{copy.centerLabel}</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{(brand?.country ?? copy.unknown).toUpperCase()} · {new Date().getFullYear() - 38}</Text>
          <Text style={styles.heroName}>{brand?.name ?? copy.defaultBrand}</Text>
          <Text style={styles.heroQuote}>{brand?.tagline ? `"${brand.tagline}"` : brandQuote(brand?.name ?? copy.quoteFallback, language)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard value={perfumes.length} label={copy.statsPerfumes} />
          <StatCard value={perfumersCount} label={copy.statsCreators} />
          <StatCard value={avgRating} label={copy.statsRating} suffix="%" />
        </View>

        <View style={styles.tabRow}>
          {([
            { key: "all", label: copy.tabsAll },
            { key: "family", label: copy.tabsFamily },
            { key: "gender", label: copy.tabsGender },
            { key: "perfumers", label: copy.tabsCreators },
          ] as Array<{ key: BrandTabKey; label: string }>).map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabButton}>
                <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {familySections.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{copy.signatureTerritories}</Text>
            <View style={styles.territoryGrid}>
              {familySections.map((family) => (
                <Pressable
                  key={family.title}
                  style={styles.territoryCell}
                  onPress={() => {
                    const target = family.items[0];
                    if (target) router.push(`/perfume/${target.id}` as never);
                  }}
                >
                  <Card variant="default" style={styles.territoryCard}>
                    <View style={[styles.territoryVisual, family.index % 4 === 0 ? styles.territoryWarm : family.index % 4 === 1 ? styles.territoryDark : family.index % 4 === 2 ? styles.territoryRose : styles.territorySand]}>
                      <View style={styles.territoryTarget}>
                        <View style={styles.territoryTargetDot} />
                      </View>
                    </View>
                    <Text style={styles.territoryTitle}>{family.title}</Text>
                    <Text style={styles.territoryMeta}>{family.items.length} {copy.works}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {perfumes.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>{copy.tabsAll}</Text>
              <Pressable onPress={() => router.push(`/discover?tab=Perfumes&q=${encodeURIComponent(brand?.name ?? "")}` as never)}>
                <Text style={styles.sectionLink}>{copy.seeAll}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {visiblePerfumes.map((perfume) => (
                <PerfumeCard key={perfume.id} perfume={perfume} onPress={() => router.push(`/perfume/${perfume.id}` as never)} />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function CircleAction({ icon, onPress }: { icon: "chevron-left" | "dots"; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[circleStyles.base, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <TabBarIcon name={icon} color={colors.accentForeground} size={16} />
    </Pressable>
  );
}

function StatCard({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Card variant="default" style={styles.statCard}>
      <Text style={styles.statValue}>{value}{suffix}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const circleStyles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,28,22,0.44)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    hero: {
      height: 284,
      backgroundColor: colors.heroSurface,
      position: "relative",
      overflow: "hidden",
    },
    topBar: {
      position: "absolute",
      top: 18,
      left: 16,
      right: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      zIndex: 2,
    },
    heroCenterMark: {
      position: "absolute",
      top: 112,
      alignSelf: "center",
      alignItems: "center",
      gap: 8,
    },
    heroTarget: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.3,
      borderColor: "rgba(255,248,241,0.8)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroTargetDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: "#FFF8F1",
    },
    heroCenterLabel: {
      fontFamily: FONTS.sans,
      fontSize: 10,
      color: "rgba(255,248,241,0.78)",
      letterSpacing: 0.5,
    },
    heroCopy: {
      position: "absolute",
      left: 18,
      right: 18,
      bottom: 22,
      gap: 4,
    },
    heroEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "rgba(255,248,241,0.88)",
    },
    heroName: {
      fontFamily: FONTS.serif,
      fontSize: 34,
      lineHeight: 38,
      color: "#FFF8F1",
      textShadowColor: "rgba(0,0,0,0.28)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroQuote: {
      fontFamily: FONTS.serif,
      fontSize: 18,
      lineHeight: 24,
      color: "rgba(255,248,241,0.94)",
      fontStyle: "italic",
    },
    body: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 40,
      gap: 18,
    },
    stateWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 28,
    },
    stateTitle: {
      fontFamily: FONTS.serif,
      fontSize: 26,
      color: colors.ink,
      textAlign: "center",
    },
    stateCopy: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
      lineHeight: 20,
    },
    stateButton: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    stateButtonText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
    },
    errorState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 28,
    },
    errorTitle: {
      fontFamily: FONTS.serif,
      fontSize: 24,
      color: colors.ink,
      textAlign: "center",
    },
    errorBody: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.inkMid,
      textAlign: "center",
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
    statCard: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 14,
      gap: 4,
    },
    statValue: {
      fontFamily: FONTS.serif,
      fontSize: 18,
      color: colors.ink,
    },
    statLabel: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
    tabRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    tabButton: {
      paddingVertical: 2,
    },
    tabLabel: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkMid,
    },
    tabLabelActive: {
      color: colors.ink,
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    sectionLink: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.accent,
    },
    territoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    territoryCell: {
      width: "48.5%",
    },
    territoryCard: {
      padding: 0,
      overflow: "hidden",
      borderRadius: 16,
    },
    territoryVisual: {
      height: 104,
      alignItems: "center",
      justifyContent: "center",
    },
    territoryWarm: {
      backgroundColor: colors.surfaceTinted,
    },
    territoryDark: {
      backgroundColor: colors.heroSurface,
    },
    territoryRose: {
      backgroundColor: colors.surfaceTinted,
    },
    territorySand: {
      backgroundColor: colors.surfaceMuted,
    },
    territoryTarget: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.3,
      borderColor: "rgba(255,248,241,0.8)",
      alignItems: "center",
      justifyContent: "center",
    },
    territoryTargetDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: "#FFF8F1",
    },
    territoryTitle: {
      fontFamily: FONTS.serif,
      fontSize: 22,
      color: colors.ink,
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    territoryMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    row: {
      gap: 12,
      paddingRight: 20,
    },
  });
