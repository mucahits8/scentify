import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { PerfumeCard } from "@/components/perfume/PerfumeCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { calculateMatchScore } from "@/services/dna";
import { getPerfumeById, getSimilarPerfumes } from "@/services/perfumes";
import { listPerfumeReviews, type PerfumeReview } from "@/services/reviews";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useUserStore } from "@/stores/useUserStore";
import { FAMILY_GRADIENTS, FONTS, RADIUS } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";
import { perfLog, perfNow } from "@/utils/perf";
import type { Perfume } from "@/utils/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);
}

function buildWhyThis(perfume: Perfume, t: (path: string) => string) {
  const basePair = perfume.baseNotes.slice(0, 2).join(t("perfume.joinAnd")).toLowerCase();
  const impression = perfume.impressions[0]?.toLowerCase() ?? t("perfume.defaultImpression");
  const season = perfume.seasons[0]?.toLowerCase() ?? t("perfume.defaultSeason");
  const repeated = perfume.topNotes[0] ?? perfume.baseNotes[0] ?? perfume.name;
  return [
    fillTemplate(t("perfume.whyLine1"), { basePair }),
    fillTemplate(t("perfume.whyLine2"), { impression, season }),
    fillTemplate(t("perfume.whyLine3"), { repeated }),
  ];
}

export default function PerfumeDetailScreen() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: viewportWidth } = useWindowDimensions();
  const scentDNA = useUserStore((state) => state.scentDNA);
  const addItem = useCollectionStore((state) => state.addItem);
  const [perfume, setPerfume] = useState<Perfume | null>(null);
  const [similarPerfumes, setSimilarPerfumes] = useState<Perfume[]>([]);
  const [reviews, setReviews] = useState<PerfumeReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [openNoteTier, setOpenNoteTier] = useState<"top" | "heart" | "base">("top");
  const [showAiSheet, setShowAiSheet] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const floatingHeaderOpacity = scrollY.interpolate({
    inputRange: [40, 180],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const heroFadeOpacity = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [1, 0.22],
    extrapolate: "clamp",
  });
  const heroBlurOpacity = scrollY.interpolate({
    inputRange: [20, 190],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  function safeBack() {
    const maybeCanGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    if (typeof maybeCanGoBack === "function" && maybeCanGoBack()) {
      router.back();
      return;
    }
    router.replace("/discover" as never);
  }

  const loadPerfume = useCallback(async () => {
    if (!id) return;
    const startedAt = perfNow();
    setLoaded(false);
    setError(null);
    try {
      const value = await getPerfumeById(id);
      setPerfume(value);
      if (!value) {
        setSimilarPerfumes([]);
        setReviews([]);
        return;
      }
      const [items, reviewItems] = await Promise.all([
        getSimilarPerfumes(value),
        listPerfumeReviews(value.id, 8),
      ]);
      setSimilarPerfumes(items ?? []);
      setReviews(reviewItems);
      perfLog("perfume.loadDetail", startedAt, { similarCount: items?.length ?? 0, reviewCount: reviewItems.length });
    } catch {
      setPerfume(null);
      setSimilarPerfumes([]);
      setReviews([]);
      setError(t("common.errorBody"));
      perfLog("perfume.loadDetail.error", startedAt);
    } finally {
      setLoaded(true);
    }
  }, [id, t]);

  useEffect(() => {
    void loadPerfume();
  }, [loadPerfume]);

  const refreshReviews = useCallback(async () => {
    if (!perfume?.id) return;
    setReviewsLoading(true);
    try {
      const items = await listPerfumeReviews(perfume.id, 8);
      setReviews(items);
    } finally {
      setReviewsLoading(false);
    }
  }, [perfume?.id]);

  useFocusEffect(
    useCallback(() => {
      void refreshReviews();
      return undefined;
    }, [refreshReviews]),
  );

  const matchScore = useMemo(() => {
    if (!perfume || !scentDNA) return undefined;
    return Math.min(99, calculateMatchScore(scentDNA, perfume.scentVector));
  }, [perfume, scentDNA]);

  const aiSummary = useMemo(() => {
    if (!perfume) return null;
    const scoreBase = Math.round(((perfume.longevity + perfume.projection) / 20) * 100);
    const score = Math.max(62, Math.min(96, scoreBase));
    const pros = [
      language === "tr"
        ? `${perfume.topNotes.slice(0, 2).join(" + ")} açılışı net bir imza veriyor.`
        : `${perfume.topNotes.slice(0, 2).join(" + ")} gives a clear opening identity.`,
      language === "tr"
        ? `Kalıcılık ${Math.round(perfume.longevity)}/10, günlük rotasyon için güvenli.`
        : `Longevity ${Math.round(perfume.longevity)}/10, reliable for daily rotation.`,
    ];
    const cons = [
      language === "tr"
        ? "Maksimum etki için soğuk hava ve yakın uygulama daha iyi sonuç verir."
        : "Performs better in cooler weather and close-range application.",
      language === "tr"
        ? "Çok güçlü yayılım bekleyen kullanıcı için daha sakin kalabilir."
        : "May feel too restrained if you want loud projection.",
    ];
    const verdict = language === "tr"
      ? "Karar: Güvenli imza adayı, koleksiyonda kalıcı yer açar."
      : "Verdict: A safe signature candidate with long-term rotation potential.";

    return { score, pros, cons, verdict };
  }, [language, perfume]);

  if (!loaded) {
    return (
      <Screen>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.stateTitle}>{t("perfume.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.ink }}>
          {t("common.errorTitle")}
        </Text>
        <Text style={{ fontFamily: FONTS.sans, fontSize: 15, color: colors.inkMid, textAlign: "center" }}>
          {error}
        </Text>
        <Button title={t("common.retry")} variant="ghost" onPress={() => void loadPerfume()} />
      </SafeAreaView>
    );
  }

  if (!perfume) {
    return (
      <Screen>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>{t("perfume.notFound")}</Text>
          <Text style={styles.stateCopy}>{t("perfume.notFoundCopy")}</Text>
          <Pressable style={styles.stateButton} onPress={() => router.replace("/discover" as never)}>
            <Text style={styles.stateButtonText}>{t("perfume.backToDiscover")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const gradientColors = FAMILY_GRADIENTS[perfume.families?.[0]] ?? FAMILY_GRADIENTS.Default;
  const brandSlug = perfume.brandSlug ?? slugify(perfume.brand);
  const whyThis = buildWhyThis(perfume, t);
  const heroSlides: Array<"bottle" | "mood" | "notes"> = ["bottle", "mood", "notes"];

  function toggleNoteTier(tier: "top" | "heart" | "base") {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenNoteTier((current) => (current === tier ? current : tier));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const page = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, viewportWidth));
              setActiveHeroSlide(Math.max(0, Math.min(heroSlides.length - 1, page)));
            }}
          >
            {heroSlides.map((slide) => (
              <View key={slide} style={[styles.heroSlide, { width: viewportWidth }]}>
                <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                {slide === "bottle" && perfume.imageUrl && !imageFailed ? (
                  <Image source={{ uri: perfume.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setImageFailed(true)} />
                ) : null}
                {slide === "mood" ? (
                  <View style={styles.heroMoodWrap}>
                    <Text style={styles.heroMoodTitle}>{t("perfume.mood")}</Text>
                    <View style={styles.tagRow}>
                      {[...perfume.families.slice(0, 3), perfume.impressions[0] ?? t("perfume.defaultMoodTag"), perfume.seasons[0] ?? t("perfume.defaultSeasonTag")]
                        .slice(0, 5)
                        .map((tag, i) => (
                          <Chip key={`${tag}-${i}`} label={tag} size="sm" selected tone="accent" />
                        ))}
                    </View>
                  </View>
                ) : null}
                {slide === "notes" ? (
                  <View style={styles.heroNotesWrap}>
                    <Text style={styles.heroMoodTitle}>{t("perfume.noteSnapshot")}</Text>
                    <Text style={styles.heroNotesText}>
                      {[...perfume.topNotes.slice(0, 2), ...perfume.midNotes.slice(0, 2), ...perfume.baseNotes.slice(0, 2)].join(" · ")}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.heroTexture} />
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: heroBlurOpacity }]}>
                  <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
                </Animated.View>
                <LinearGradient colors={["rgba(0,0,0,0.08)", "rgba(20,15,12,0.82)"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.18 }} end={{ x: 0, y: 1 }} />
              </View>
            ))}
          </ScrollView>

          <Animated.View style={[styles.heroTopBar, { opacity: heroFadeOpacity }]}>
            <CircleAction icon="chevron-left" onPress={safeBack} />
            <View style={styles.heroActions}>
              <CircleAction
                icon="heart"
                onPress={async () => {
                  triggerHaptic("success").catch(() => undefined);
                  await addItem(perfume.id, "wishlist");
                  Alert.alert(t("perfume.savedTitle"), t("perfume.savedCopy"));
                }}
              />
              <CircleAction icon="bookmark" onPress={() => router.push(`/add-to-collection/${perfume.id}` as never)} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.heroCenterMark, { opacity: heroFadeOpacity }]}>
            <View style={styles.heroTarget}>
              <View style={styles.heroTargetDot} />
            </View>
            <Text style={styles.heroCenterLabel}>
              {activeHeroSlide === 0 ? t("perfume.heroLabelBottle") : activeHeroSlide === 1 ? t("perfume.heroLabelMood") : t("perfume.heroLabelNotes")}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.heroCopy, { opacity: heroFadeOpacity }]}>
            <Text style={styles.heroEyebrow}>
              {perfume.brand.toUpperCase()} · {perfume.year ?? t("perfume.edition")}
            </Text>
            <Text style={styles.heroName}>{perfume.name}</Text>
            <Text style={styles.heroMeta}>
              {t("perfume.by")} {perfume.perfumers?.[0] ?? t("perfume.unknown")} · {perfume.gender}
            </Text>
            <View style={styles.heroPagerRow}>
              {heroSlides.map((_, index) => (
                <View key={index} style={[styles.heroPagerDot, activeHeroSlide === index && styles.heroPagerDotActive]} />
              ))}
            </View>
          </Animated.View>
        </View>

        <View style={styles.body}>
        {typeof matchScore === "number" ? (
          <View style={styles.matchRow}>
            <View style={styles.matchCircle}>
              <Text style={styles.matchCircleText}>{matchScore}%</Text>
            </View>
            <View style={styles.matchCopy}>
              <Text style={styles.matchEyebrow}>{t("perfume.yourMatch")}</Text>
              <Text style={styles.matchHeadline}>{t("perfume.topFit")}</Text>
            </View>
          </View>
        ) : null}

        <Pressable onPress={() => router.push(`/brand/${brandSlug}` as never)} style={styles.brandLinkPill}>
          <TabBarIcon name="discover" color={colors.accent} size={12} focused />
          <Text style={styles.brandLinkText}>{t("perfume.exploreBrand")} {perfume.brand}</Text>
          <TabBarIcon name="chevron-right" color={colors.inkFaint} size={14} />
        </Pressable>

        <Pressable
          onPress={() =>
            router.push(
              {
                pathname: "/create-post",
                params: {
                  perfumeId: perfume.id,
                  type: "review",
                },
              } as never,
            )
          }
          style={styles.inlineCreatePost}
        >
          <Text style={styles.inlineCreatePostText}>
            {language === "tr" ? "Bu koku ile gönderi oluştur +" : "Create a post with this scent +"}
          </Text>
        </Pressable>

        <View style={styles.tagRow}>
          {[...perfume.families.slice(0, 4), `${perfume.seasons[0] ?? t("perfume.dailyHeat")}`, perfume.occasions[0] ?? t("perfume.coolWeather")]
            .slice(0, 6)
            .map((tag) => (
              <Chip key={tag} label={tag} size="sm" selected tone="accent" />
            ))}
        </View>

        <Card variant="tinted" style={styles.whyCard}>
          <Text style={styles.blockEyebrow}>{t("perfume.whyFits")}</Text>
          {whyThis.map((line, index) => (
            <View key={line} style={styles.reasonRow}>
              <Text style={styles.reasonIndex}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={styles.reasonText}>{line}</Text>
            </View>
          ))}
        </Card>

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{t("perfume.olfComposition")}</Text>
            <View style={styles.noteStack}>
              <NoteTierAccordion
                title={t("perfume.topNotes")}
                notes={perfume.topNotes}
                styles={styles}
                open={openNoteTier === "top"}
                onPress={() => toggleNoteTier("top")}
              />
              <NoteTierAccordion
                title={t("perfume.heartNotes")}
                notes={perfume.midNotes}
                styles={styles}
                open={openNoteTier === "heart"}
                onPress={() => toggleNoteTier("heart")}
              />
              <NoteTierAccordion
                title={t("perfume.baseNotes")}
                notes={perfume.baseNotes}
                styles={styles}
                open={openNoteTier === "base"}
                onPress={() => toggleNoteTier("base")}
              />
            </View>
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>{t("perfume.performance")}</Text>
          <Card variant="default" style={styles.performanceCard}>
            <MetricLine label={t("perfume.longevity")} value={perfume.longevity} styles={styles} colors={colors} />
            <MetricLine label={t("perfume.sillage")} value={perfume.projection} styles={styles} colors={colors} />
            <MetricLine label={t("perfume.projection")} value={Math.max(0, perfume.projection - 1.2)} styles={styles} colors={colors} />
          </Card>
        </View>

        {(perfume.perfumers ?? []).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{t("perfume.byCreators")}</Text>
            <View style={styles.tagRow}>
              {(perfume.perfumers ?? []).map((perfumer) => (
                <Pressable key={perfumer} style={styles.inlinePill} onPress={() => router.push(`/perfumer/${slugify(perfumer)}` as never)}>
                  <TabBarIcon name="sparkle" color={colors.accent} size={12} focused />
                  <Text style={styles.inlinePillText}>{perfumer}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionRowHeader}>
            <Text style={styles.sectionEyebrow}>{language === "tr" ? "Topluluk yorumları" : "Community reviews"}</Text>
            <Pressable onPress={() => router.push(`/review/${perfume.id}` as never)} hitSlop={8}>
              <Text style={styles.sectionLink}>{language === "tr" ? "Yorum yaz" : "Write review"}</Text>
            </Pressable>
          </View>
          {reviewsLoading ? (
            <View style={styles.reviewLoader}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : (
            <View style={styles.reviewList}>
              {reviews.slice(0, 4).map((review) => (
                <Card key={review.id} variant="default" style={styles.reviewCard}>
                  <View style={styles.reviewTopRow}>
                    <Pressable onPress={() => router.push(`/user/${review.author.id}` as never)} hitSlop={8}>
                      <Text style={styles.reviewAuthor}>{review.author.name}</Text>
                    </Pressable>
                    <Text style={styles.reviewRating}>{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}</Text>
                  </View>
                  <Text style={styles.reviewBody}>{review.comment}</Text>
                  <Text style={styles.reviewMeta}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </Card>
              ))}
              {reviews.length === 0 ? (
                <Card variant="flat" style={styles.reviewEmptyCard}>
                  <Text style={styles.reviewEmptyTitle}>{language === "tr" ? "Henüz yorum yok" : "No reviews yet"}</Text>
                  <Text style={styles.reviewEmptyCopy}>
                    {language === "tr"
                      ? "İlk yorumu bırakıp profile katkı sağlayabilirsin."
                      : "Be the first to leave a review for this scent."}
                  </Text>
                </Card>
              ) : null}
              <Pressable style={styles.reviewRefreshButton} onPress={() => void refreshReviews()}>
                <Text style={styles.reviewRefreshText}>{language === "tr" ? "Yorumları yenile" : "Refresh reviews"}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {similarPerfumes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{t("perfume.mayAlsoLike")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
              {similarPerfumes.map((item) => (
                <PerfumeCard key={item.id} perfume={item} onPress={() => router.push(`/perfume/${item.id}` as never)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

          <View style={styles.actionsSpacer} />
        </View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="box-none" style={[styles.floatingHeader, { opacity: floatingHeaderOpacity }]}>
        <Card variant="glass" style={styles.floatingHeaderCard}>
          <View style={styles.floatingHeaderContent}>
            <CircleAction icon="chevron-left" onPress={safeBack} />
            <Text numberOfLines={1} style={styles.floatingHeaderTitle}>{perfume.name}</Text>
            <CircleAction icon="bookmark" onPress={() => router.push(`/add-to-collection/${perfume.id}` as never)} />
          </View>
        </Card>
      </Animated.View>

      <View style={styles.stickyBar}>
        <Button title={t("perfume.addCollection")} variant="primary" style={styles.actionPrimary} onPress={() => router.push(`/add-to-collection/${perfume.id}` as never)} />
        <Button title={t("perfume.rate")} variant="secondary" style={styles.actionSecondary} onPress={() => router.push(`/rate/${perfume.id}` as never)} />
        <Button
          title={language === "tr" ? "AI" : "AI"}
          variant="ghost"
          style={styles.actionTertiary}
          onPress={() => {
            triggerHaptic("impact").catch(() => undefined);
            setShowAiSheet(true);
          }}
        />
      </View>

      {showAiSheet && aiSummary ? (
        <View style={styles.aiOverlay} pointerEvents="box-none">
          <Pressable style={styles.aiBackdrop} onPress={() => setShowAiSheet(false)} />
          <Card variant="glass" style={styles.aiSheet}>
            <Text style={styles.aiEyebrow}>{language === "tr" ? "AI Değerlendirme" : "AI Evaluation"}</Text>
            <Text style={styles.aiScore}>{aiSummary.score}/100</Text>
            <Text style={styles.aiVerdict}>{aiSummary.verdict}</Text>
            <View style={styles.aiColumns}>
              <View style={styles.aiColumn}>
                <Text style={styles.aiColumnTitle}>{language === "tr" ? "Artılar" : "Pros"}</Text>
                {aiSummary.pros.map((line) => (
                  <Text key={line} style={styles.aiLine}>• {line}</Text>
                ))}
              </View>
              <View style={styles.aiColumn}>
                <Text style={styles.aiColumnTitle}>{language === "tr" ? "Dikkat" : "Cons"}</Text>
                {aiSummary.cons.map((line) => (
                  <Text key={line} style={styles.aiLine}>• {line}</Text>
                ))}
              </View>
            </View>
            <Button
              title={language === "tr" ? "Kapat" : "Close"}
              variant="secondary"
              onPress={() => setShowAiSheet(false)}
            />
          </Card>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function CircleAction({ icon, onPress }: { icon: "chevron-left" | "heart" | "bookmark"; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[circleStyles.base, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <TabBarIcon name={icon} color={colors.ink} size={16} />
    </Pressable>
  );
}

function MetricLine({ label, value, styles, colors }: { label: string; value: number; styles: ReturnType<typeof createStyles>; colors: ReturnType<typeof useTheme>["colors"] }) {
  const pct = Math.max(8, Math.min(100, Math.round((value / 10) * 100)));
  return (
    <View style={styles.metricWrap}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{Math.round(value)}/10</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
      </View>
    </View>
  );
}

function NoteTierAccordion({
  title,
  notes,
  styles,
  open,
  onPress,
}: {
  title: string;
  notes: string[];
  styles: ReturnType<typeof createStyles>;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card variant="default" style={styles.noteTier}>
        <View style={styles.noteTierHeader}>
          <Text style={styles.noteTierTitle}>{title}</Text>
          <Text style={styles.noteTierToggle}>{open ? "-" : "+"}</Text>
        </View>
        {open ? <Text style={styles.noteTierNotes}>{(notes.length ? notes : ["—"]).join(" · ")}</Text> : null}
      </Card>
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
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingBottom: 118,
    },
    hero: {
      height: 386,
      position: "relative",
      overflow: "hidden",
    },
    heroSlide: {
      height: 386,
      position: "relative",
      overflow: "hidden",
    },
    heroTexture: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    heroTopBar: {
      position: "absolute",
      top: 18,
      left: 16,
      right: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 2,
    },
    floatingHeader: {
      position: "absolute",
      top: 10,
      left: 12,
      right: 12,
      zIndex: 20,
    },
    floatingHeaderCard: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: RADIUS.xl,
    },
    floatingHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    floatingHeaderTitle: {
      flex: 1,
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
      textAlign: "center",
      paddingHorizontal: 4,
    },
    heroActions: {
      flexDirection: "row",
      gap: 10,
    },
    heroCenterMark: {
      position: "absolute",
      top: 142,
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
      color: "rgba(255,248,241,0.82)",
      letterSpacing: 0.5,
    },
    heroMoodWrap: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 120,
      gap: 8,
      zIndex: 2,
    },
    heroNotesWrap: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 124,
      gap: 8,
      zIndex: 2,
    },
    heroMoodTitle: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: "rgba(255,248,241,0.92)",
    },
    heroNotesText: {
      fontFamily: FONTS.serif,
      fontSize: 20,
      lineHeight: 26,
      color: "#FFF8F1",
      textShadowColor: "rgba(0,0,0,0.34)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroCopy: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 28,
      gap: 4,
    },
    heroEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: "rgba(255,248,241,0.9)",
    },
    heroName: {
      fontFamily: FONTS.serif,
      fontSize: 34,
      lineHeight: 38,
      color: "#FFF8F1",
      textShadowColor: "rgba(0,0,0,0.34)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroMeta: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: "rgba(255,248,241,0.92)",
    },
    heroPagerRow: {
      marginTop: 6,
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
    },
    heroPagerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,248,241,0.36)",
    },
    heroPagerDotActive: {
      width: 18,
      backgroundColor: "rgba(255,248,241,0.95)",
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 22,
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
    brandLinkPill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: RADIUS.full,
    },
    brandLinkText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.ink,
    },
    matchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    matchCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    matchCircleText: {
      fontFamily: FONTS.sansBold,
      fontSize: 12,
      color: colors.ink,
    },
    matchCopy: {
      flex: 1,
      gap: 2,
    },
    matchEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.inkMid,
    },
    matchHeadline: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      lineHeight: 19,
      color: colors.ink,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    whyCard: {
      gap: 12,
      paddingVertical: 18,
    },
    blockEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
    },
    reasonRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    reasonIndex: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      color: colors.accent,
      paddingTop: 2,
    },
    reasonText: {
      flex: 1,
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.ink,
    },
    section: {
      gap: 12,
    },
    sectionRowHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    sectionLink: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    sectionEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.inkMid,
    },
    noteStack: {
      gap: 10,
    },
    noteTier: {
      gap: 6,
      paddingVertical: 14,
    },
    noteTierHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    noteTierTitle: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    noteTierToggle: {
      fontFamily: FONTS.sansBold,
      fontSize: 18,
      lineHeight: 20,
      color: colors.inkMid,
    },
    noteTierNotes: {
      fontFamily: FONTS.serif,
      fontSize: 18,
      lineHeight: 24,
      color: colors.ink,
    },
    performanceCard: {
      gap: 14,
      paddingVertical: 18,
    },
    metricWrap: {
      gap: 6,
    },
    metricHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    metricLabel: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.ink,
    },
    metricValue: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
    metricTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.borderLight,
      overflow: "hidden",
    },
    metricFill: {
      height: "100%",
      borderRadius: 999,
    },
    inlinePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inlinePillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.ink,
    },
    similarRow: {
      gap: 12,
      paddingRight: 20,
    },
    reviewLoader: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },
    reviewList: {
      gap: 10,
    },
    reviewCard: {
      gap: 8,
      paddingVertical: 12,
    },
    reviewTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    reviewAuthor: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    reviewRating: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.accent,
      letterSpacing: 0.2,
    },
    reviewBody: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.ink,
      lineHeight: 21,
    },
    reviewMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
    },
    reviewEmptyCard: {
      gap: 6,
      paddingVertical: 14,
    },
    reviewEmptyTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    reviewEmptyCopy: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
      lineHeight: 20,
    },
    reviewRefreshButton: {
      alignSelf: "flex-start",
      paddingVertical: 6,
    },
    reviewRefreshText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    actionsSpacer: {
      height: 2,
    },
    stickyBar: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 8,
      flexDirection: "row",
      gap: 10,
      padding: 10,
      borderRadius: RADIUS.xl,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    actionPrimary: {
      flex: 1,
    },
    actionSecondary: {
      width: 102,
    },
    actionTertiary: {
      width: 72,
      minHeight: 44,
      paddingHorizontal: 0,
    },
    inlineCreatePost: {
      alignSelf: "flex-start",
      marginTop: 2,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    inlineCreatePostText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    aiOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      padding: 12,
    },
    aiBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(8,7,6,0.42)",
    },
    aiSheet: {
      gap: 10,
      padding: 14,
      borderRadius: RADIUS.xl,
    },
    aiEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.accent,
    },
    aiScore: {
      fontFamily: FONTS.serif,
      fontSize: 34,
      color: colors.ink,
      lineHeight: 38,
    },
    aiVerdict: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    aiColumns: {
      flexDirection: "row",
      gap: 10,
    },
    aiColumn: {
      flex: 1,
      gap: 6,
    },
    aiColumnTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.ink,
    },
    aiLine: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkMid,
    },
  });
