import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useTheme } from "@/components/theme/ThemeProvider";
import { PerfumeVisual } from "@/components/perfume/PerfumeVisual";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { useScanStore } from "@/stores/useScanStore";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";
import type { CollectionStatus } from "@/utils/types";

const TABS: { key: CollectionStatus | "all"; labelKey: string }[] = [
  { key: "all", labelKey: "collection.all" },
  { key: "owned", labelKey: "collection.owned" },
  { key: "wishlist", labelKey: "collection.wishlist" },
  { key: "sampled", labelKey: "collection.sampled" },
];

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CollectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<CollectionStatus | "all">("all");

  const items = useCollectionStore((state) => state.items);
  const getByStatus = useCollectionStore((state) => state.getByStatus);
  const seedDemoItems = useCollectionStore((state) => state.seedDemoItems);
  const profile = useUserStore((state) => state.profile);
  const hasSeededOnceRef = useRef(false);

  const displayItems = activeTab === "all" ? items : getByStatus(activeTab);
  const ownerLabel = profile?.fullName?.split(" ")[0] ?? t("collection.defaultOwner");
  const resetScan = useScanStore((s) => s.reset);
  const ownedCount = getByStatus("owned").length;
  const wishlistCount = getByStatus("wishlist").length;
  const sampledCount = getByStatus("sampled").length;
  const avgLongevity = Math.round(
    (items.reduce((total, item) => total + (item.perfume.longevity || 0), 0) / Math.max(items.length, 1)) * 10,
  ) / 10;
  const statusLabel = language === "tr"
    ? {
      owned: "Sahip",
      wishlist: "Wishlist",
      sampled: "Denendi",
    }
    : {
      owned: "Owned",
      wishlist: "Wishlist",
      sampled: "Sampled",
    };

  const handleScan = () => {
    resetScan();
    router.push("/(scan)/capture" as never);
  };

  const handleTabChange = (nextTab: CollectionStatus | "all") => {
    if (nextTab === activeTab) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    triggerHaptic("selection").catch(() => undefined);
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (items.length > 0 || hasSeededOnceRef.current) return;
    hasSeededOnceRef.current = true;
    void seedDemoItems();
  }, [items.length, seedDemoItems]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{ownerLabel}{t("collection.archive")}</Text>
        <Text style={styles.title}>{t("collection.title")}</Text>
        <Text style={styles.meta}>
          {items.length} {t("collection.perfumes")}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{statusLabel.owned}</Text>
          <Text style={styles.metricValue}>{ownedCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{statusLabel.wishlist}</Text>
          <Text style={styles.metricValue}>{wishlistCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{statusLabel.sampled}</Text>
          <Text style={styles.metricValue}>{sampledCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{language === "tr" ? "Ort. Kalıcılık" : "Avg Longevity"}</Text>
          <Text style={styles.metricValue}>{avgLongevity}/10</Text>
        </View>
      </ScrollView>

      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map((tab) => {
            const count = tab.key === "all" ? items.length : getByStatus(tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {t(tab.labelKey)}
                  {count > 0 ? ` · ${count}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t("collection.emptyTitle")}</Text>
            <Text style={styles.emptyCopy}>{t("collection.emptyCopy")}</Text>
            <Pressable style={styles.scanEmptyBtn} onPress={handleScan}>
              <Text style={styles.scanEmptyBtnText}>📷 Parfüm Tarat</Text>
            </Pressable>
            <Pressable
              style={styles.sampleCta}
              onPress={() => {
                void seedDemoItems();
              }}
            >
              <Text style={styles.sampleCtaText}>
                {language === "tr" ? "Örnek koleksiyon doldur" : "Load sample collection"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.exploreCta}
              onPress={() => router.push("/(main)/discover" as never)}
            >
              <Text style={styles.exploreCtaText}>{t("collection.explore")}</Text>
            </Pressable>
            <Pressable
              style={styles.onboardingCta}
              onPress={() => router.push("/(onboarding)/gender" as never)}
            >
              <Text style={styles.onboardingCtaText}>
                {t("home.profileMissingCta")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.gridCard}
                onPress={() => router.push(`/collection/${item.perfume.id}` as never)}
              >
                <View style={styles.gridImageWrap}>
                  <PerfumeVisual perfume={item.perfume} height={156} variant="card" />
                  <View style={styles.gridBadge}>
                    <Text style={styles.gridBadgeText}>
                      {item.status === "owned" ? statusLabel.owned : item.status === "wishlist" ? statusLabel.wishlist : statusLabel.sampled}
                    </Text>
                  </View>
                </View>
                <View style={styles.gridBody}>
                  <Text numberOfLines={1} style={styles.gridBrand}>{item.perfume.brand}</Text>
                  <Text numberOfLines={2} style={styles.gridName}>{item.perfume.name}</Text>
                  <Text style={styles.gridMeta}>
                    {item.perfume.concentration ?? "EDP"} · {item.perfume.year ?? "—"}
                  </Text>
                  <View style={styles.gridActionsRow}>
                    <Pressable
                      style={styles.gridActionPill}
                      onPress={(event) => {
                        event.stopPropagation();
                        triggerHaptic("selection").catch(() => undefined);
                        router.push(`/collection/${item.perfume.id}` as never);
                      }}
                    >
                      <View style={styles.gridActionInner}>
                        <TabBarIcon name="chevron-right" color={colors.accent} size={11} />
                        <Text style={styles.gridActionText}>{language === "tr" ? "Detay" : "Detail"}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.gridActionPill}
                      onPress={(event) => {
                        event.stopPropagation();
                        triggerHaptic("selection").catch(() => undefined);
                        router.push(`/add-to-collection/${item.perfume.id}` as never);
                      }}
                    >
                      <View style={styles.gridActionInner}>
                        <TabBarIcon name="collection" color={colors.accent} size={11} />
                        <Text style={styles.gridActionText}>{language === "tr" ? "Durum" : "Status"}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.gridActionPill}
                      onPress={(event) => {
                        event.stopPropagation();
                        triggerHaptic("impact").catch(() => undefined);
                        router.push({ pathname: "/create-post", params: { perfumeId: item.perfume.id } } as never);
                      }}
                    >
                      <View style={styles.gridActionInner}>
                        <TabBarIcon name="sparkle" color={colors.accent} size={11} />
                        <Text style={styles.gridActionText}>{language === "tr" ? "Paylaşım" : "Post"}</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Scan FAB */}
      <Pressable style={[styles.fab, { backgroundColor: colors.accent }]} onPress={handleScan}>
        <Text style={styles.fabIcon}>📷</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
      gap: SPACING.xs,
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 34,
      lineHeight: 40,
      color: colors.ink,
    },
    meta: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
    },
    metricRow: {
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    metricCard: {
      minWidth: 132,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      gap: 2,
    },
    metricLabel: {
      fontFamily: FONTS.sans,
      fontSize: 11,
      color: colors.inkFaint,
    },
    metricValue: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 16,
      color: colors.ink,
    },
    tabsRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tabsContent: {
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    tab: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    tabText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkMid,
    },
    tabTextActive: {
      color: "#FFFFFF",
    },
    scrollContent: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.md,
      flexGrow: 1,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: SPACING.md,
    },
    gridCard: {
      width: "48%",
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
      ...SHADOWS.soft,
    },
    gridImageWrap: {
      height: 148,
      position: "relative",
      backgroundColor: colors.surface,
    },
    gridBadge: {
      position: "absolute",
      left: SPACING.sm,
      bottom: SPACING.sm,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
    },
    gridBadgeText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 10,
      color: colors.accent,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    gridBody: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.sm + 2,
      gap: 2,
    },
    gridBrand: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.inkMid,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    gridName: {
      fontFamily: FONTS.serif,
      fontSize: 17,
      lineHeight: 21,
      color: colors.ink,
      minHeight: 42,
    },
    gridMeta: {
      fontFamily: FONTS.sans,
      fontSize: 11,
      color: colors.inkFaint,
    },
    gridActionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: SPACING.xs,
    },
    gridActionPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
    },
    gridActionInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    gridActionText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 10,
      color: colors.accent,
      letterSpacing: 0.3,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.xxxl * 2,
      gap: SPACING.lg,
    },
    emptyTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
      textAlign: "center",
    },
    emptyCopy: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
      lineHeight: 21,
    },
    scanEmptyBtn: {
      backgroundColor: colors.accentLight,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    scanEmptyBtnText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 15,
      color: colors.accent,
    },
    sampleCta: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.full,
    },
    sampleCtaText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkMid,
    },
    exploreCta: {
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
    },
    exploreCtaText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: "#FFFFFF",
    },
    onboardingCta: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    onboardingCtaText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkMid,
    },
    fab: {
      position: "absolute",
      bottom: SPACING.xl,
      right: SPACING.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      ...SHADOWS.lift,
    },
    fabIcon: { fontSize: 24 },
  });
