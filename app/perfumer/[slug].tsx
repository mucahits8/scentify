import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { PerfumeCard } from "@/components/perfume/PerfumeCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EntityVisual } from "@/components/ui/EntityVisual";
import { Screen } from "@/components/ui/Screen";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { getPerfumerBySlug, getPerfumesByPerfumerSlug } from "@/services/perfumes";
import { FONTS, RADIUS } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import { perfLog, perfNow } from "@/utils/perf";
import type { Perfume, Perfumer } from "@/utils/types";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function PerfumerDetailScreen() {
  const { language, t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [perfumer, setPerfumer] = useState<Perfumer | null>(null);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = language === "tr"
    ? {
      loading: "Yaratıcı detayı yükleniyor…",
      notFound: "Yaratıcı bulunamadı",
      notFoundCopy: "Bu profil şu anda kullanılamıyor olabilir.",
      backToDiscover: "Keşfete Dön",
      defaultName: "Yaratıcı",
      profileLabel: "Yaratıcı · burun",
      works: "eser",
      follow: "Takip Et",
      followedTitle: "Takip edildi",
      followedCopy: "Artık keşfet akışında daha sık gösterilecek.",
      quoteMeta: "2024 röportajından",
      signatureFamilies: "İmza aileler",
      worksWith: "Çalıştığı markalar",
      allWorks: "İşleri",
      signatureWorks: "İmza işleri",
      allPrefix: "Tümü",
      defaultCity: "Grasse",
      defaultCountry: "FR",
      defaultBrandCountry: "Fransa",
    }
    : {
      loading: "Loading perfumer detail…",
      notFound: "Perfumer not found",
      notFoundCopy: "This profile may be unavailable right now.",
      backToDiscover: "Back to Discover",
      defaultName: "Creator",
      profileLabel: "Creator · nose",
      works: "works",
      follow: "Follow",
      followedTitle: "Followed",
      followedCopy: "Now appears higher in your discovery flow.",
      quoteMeta: "From a 2024 interview",
      signatureFamilies: "Signature families",
      worksWith: "Works with",
      allWorks: "Works",
      signatureWorks: "Signature works",
      allPrefix: "All",
      defaultCity: "Grasse",
      defaultCountry: "FR",
      defaultBrandCountry: "France",
    };

  function safeBack() {
    const maybeCanGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    if (typeof maybeCanGoBack === "function" && maybeCanGoBack()) {
      router.back();
      return;
    }
    router.replace("/discover" as never);
  }

  const loadPerfumerDetail = useCallback(async () => {
    if (!slug) return;
    const startedAt = perfNow();
    setLoaded(false);
    setError(null);
    try {
      const [perfumerValue, perfumeValues] = await Promise.all([getPerfumerBySlug(slug), getPerfumesByPerfumerSlug(slug)]);
      setPerfumer(perfumerValue);
      setPerfumes(perfumeValues);
      perfLog("perfumer.loadDetail", startedAt, { perfumes: perfumeValues.length });
    } catch (err) {
      setPerfumer(null);
      setPerfumes([]);
      setError(err instanceof Error && err.message ? err.message : t("common.errorBody"));
      perfLog("perfumer.loadDetail.error", startedAt);
    } finally {
      setLoaded(true);
    }
  }, [slug, t]);

  useEffect(() => {
    void loadPerfumerDetail();
  }, [loadPerfumerDetail]);

  const topBrands = useMemo(() => {
    const seen = new Map<string, number>();
    perfumes.forEach((perfume) => seen.set(perfume.brand, (seen.get(perfume.brand) ?? 0) + 1));
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [perfumes]);

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
          <Button title={t("common.retry")} variant="ghost" onPress={() => void loadPerfumerDetail()} />
        </View>
      </Screen>
    );
  }

  if (!perfumer && perfumes.length === 0) {
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

  const perfumerName = perfumer?.name ?? copy.defaultName;
  const signatureFamilies = perfumer?.signatureFamilies ?? [];

  return (
    <Screen scroll noPadding>
      <View style={styles.pageTop}>
        <View style={styles.topBar}>
          <CircleAction icon="chevron-left" onPress={safeBack} />
          <CircleAction icon="dots" onPress={() => router.push(`/discover?tab=Perfumers&q=${encodeURIComponent(perfumerName)}` as never)} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.identityRow}>
          <View style={styles.portraitWrap}>
            <View style={styles.portraitCard}>
              {perfumer?.portraitUrl ? (
                <Image source={{ uri: perfumer.portraitUrl }} resizeMode="cover" style={styles.portraitImage} />
              ) : (
                <EntityVisual imageUrl={null} label="portrait" tone="warm" height={126} />
              )}
            </View>
            <View style={styles.initialBadge}>
              <Text style={styles.initialText}>
                {perfumerName
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .slice(0, 2)
                  .join("")}
              </Text>
            </View>
          </View>

          <View style={styles.identityCopy}>
            <Text style={styles.eyebrow}>{copy.profileLabel}</Text>
            <Text style={styles.name}>{perfumerName}</Text>
            <Text style={styles.meta}>
              {perfumer?.city ?? perfumes[0]?.country ?? copy.defaultCity}, {perfumer?.country ?? copy.defaultCountry} · {perfumer?.perfumeCount ?? perfumes.length} {copy.works}
            </Text>
            <Pressable style={styles.followButton} onPress={() => Alert.alert(copy.followedTitle, `${perfumerName} ${copy.followedCopy}`)}>
              <Text style={styles.followButtonText}>{copy.follow}</Text>
            </Pressable>
          </View>
        </View>

        <Card variant="default" style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            {perfumer?.quote ?? "\"I want resin to feel like late afternoon — slow, golden, slightly tired.\""}
          </Text>
          <Text style={styles.quoteMeta}>{copy.quoteMeta}</Text>
        </Card>

        {signatureFamilies.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{copy.signatureFamilies}</Text>
            <View style={styles.tagRow}>
              {[...signatureFamilies, "Slow heat"].slice(0, 5).map((family) => (
                <Chip key={family} label={family} size="sm" selected tone="accent" />
              ))}
            </View>
          </View>
        ) : null}

        {topBrands.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{copy.worksWith}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
              {topBrands.map(([brand]) => (
                <Pressable key={brand} onPress={() => router.push(`/brand/${slugify(brand)}` as never)}>
                  <Card variant="default" style={styles.brandCard}>
                    <View style={styles.brandMiniVisual}>
                      <View style={styles.brandMiniTarget}>
                        <View style={styles.brandMiniDot} />
                      </View>
                    </View>
                    <Text style={styles.brandCardName}>{brand}</Text>
                    <Text style={styles.brandCardMeta}>{perfumes.find((item) => item.brand === brand)?.country ?? copy.defaultBrandCountry}</Text>
                  </Card>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {perfumes.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>{copy.allWorks}</Text>
              <Pressable onPress={() => router.push(`/discover?tab=Perfumes&q=${encodeURIComponent(perfumerName)}` as never)}>
                <Text style={styles.sectionLink}>{copy.allPrefix} {perfumes.length}</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionTitle}>{copy.signatureWorks}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.worksRow}>
              {perfumes.map((perfume) => (
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
    <Pressable onPress={onPress} style={[circleStyles.base, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TabBarIcon name={icon} color={colors.ink} size={16} />
    </Pressable>
  );
}

const circleStyles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    pageTop: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
      gap: 20,
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
    identityRow: {
      flexDirection: "row",
      gap: 14,
      alignItems: "flex-start",
    },
    portraitWrap: {
      position: "relative",
    },
    portraitCard: {
      width: 96,
      height: 126,
      borderRadius: 12,
      backgroundColor: colors.surfaceTinted,
      overflow: "hidden",
    },
    portraitImage: {
      width: "100%",
      height: "100%",
    },
    initialBadge: {
      position: "absolute",
      right: -8,
      bottom: -8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    initialText: {
      fontFamily: FONTS.serif,
      fontSize: 14,
      color: colors.accentForeground,
    },
    identityCopy: {
      flex: 1,
      gap: 4,
      paddingTop: 6,
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 34,
      lineHeight: 38,
      color: colors.ink,
    },
    meta: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
    },
    followButton: {
      alignSelf: "flex-start",
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    followButtonText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.ink,
    },
    quoteCard: {
      gap: 8,
      paddingVertical: 20,
    },
    quoteText: {
      fontFamily: FONTS.serif,
      fontSize: 17,
      lineHeight: 29,
      color: colors.ink,
      fontStyle: "italic",
    },
    quoteMeta: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    sectionTitle: {
      fontFamily: FONTS.serif,
      fontSize: 20,
      color: colors.ink,
      marginTop: -6,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    brandRow: {
      gap: 10,
      paddingRight: 20,
    },
    brandCard: {
      width: 128,
      padding: 12,
      gap: 8,
    },
    brandMiniVisual: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.heroSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    brandMiniTarget: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#FFF8F1",
      alignItems: "center",
      justifyContent: "center",
    },
    brandMiniDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#FFF8F1",
    },
    brandCardName: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 15,
      color: colors.ink,
    },
    brandCardMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
    worksRow: {
      gap: 12,
      paddingRight: 20,
    },
  });
