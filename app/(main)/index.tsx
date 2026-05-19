import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { PerfumeVisual } from "@/components/perfume/PerfumeVisual";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { listCommunityPosts, subscribeToCommunityFeed, type CommunityPost } from "@/services/community";
import { listNotifications, subscribeNotifications } from "@/services/notifications";
import { getForYouSections, type ForYouSections } from "@/services/recommendations";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { useUserStore } from "@/stores/useUserStore";
import { FAMILY_GRADIENTS, FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import { localizeScentLabel } from "@/utils/scentLabels";
import type { Perfume, Recommendation, WeatherSnapshot } from "@/utils/types";

// Stable mock weather — seeded once per session so it feels consistent
const MOCK_WEATHER: WeatherSnapshot = {
  city: "İstanbul",
  temp: 18 + Math.floor(Math.random() * 10),
  condition: ["Clear", "Partly Cloudy", "Cloudy"][Math.floor(Math.random() * 3)],
};

function conditionEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("partly")) return "🌤";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("rain")) return "🌧";
  if (c.includes("snow")) return "❄️";
  return "🌡";
}

function greetWord(t: (k: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("home.greetingMorning");
  if (h < 18) return t("home.greetingAfternoon");
  return t("home.greetingEvening");
}

function familyGrad(perfume: Perfume): [string, string] {
  const f = perfume.families?.[0];
  return (f ? FAMILY_GRADIENTS[f] : undefined) ?? FAMILY_GRADIENTS.Default;
}

// Large hero card for Today's Pick
function HeroCard({
  rec,
  onPress,
}: {
  rec: Recommendation;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { language } = useI18n();
  const { width } = useWindowDimensions();
  const [grad0, grad1] = familyGrad(rec.perfume);
  const cardWidth = width - SPACING.xxl * 2;
  const styles = useMemo(() => heroStyles(colors, isDark), [colors, isDark]);

  const family = rec.perfume.families?.[0];
  const familyLabel = family ? localizeScentLabel(family, language) : "";

  return (
    <Pressable style={[styles.card, { width: cardWidth, height: cardWidth * 0.72 }]} onPress={onPress}>
      {/* gradient base */}
      <LinearGradient
        colors={[grad0, grad1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <PerfumeVisual perfume={rec.perfume} height={cardWidth * 0.72} variant="hero" />

      {/* dark bottom overlay */}
      <LinearGradient
        colors={["transparent", "rgba(16,12,9,0.78)"]}
        style={styles.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* match badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{rec.matchScore}%</Text>
      </View>

      {/* bottom info */}
      <View style={styles.info}>
        {familyLabel ? (
          <Text style={styles.family}>{familyLabel.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.perfumeName} numberOfLines={1}>{rec.perfume.name}</Text>
        <Text style={styles.brandName} numberOfLines={1}>{rec.perfume.brand}</Text>
      </View>

      {/* arrow */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </Pressable>
  );
}

// Small carousel card
function MiniCard({
  rec,
  onPress,
}: {
  rec: Recommendation;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { language } = useI18n();
  const [grad0, grad1] = familyGrad(rec.perfume);
  const styles = useMemo(() => miniStyles(colors, isDark), [colors, isDark]);
  const family = rec.perfume.families?.[0];
  const familyLabel = family ? localizeScentLabel(family, language) : "";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.visual}>
        <LinearGradient
          colors={[grad0, grad1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
        <PerfumeVisual perfume={rec.perfume} height={150} variant="card" />
        <LinearGradient
          colors={["transparent", "rgba(16,12,9,0.6)"]}
          style={styles.miniOverlay}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.miniBadge}>
          <Text style={styles.miniBadgeText}>{rec.matchScore}%</Text>
        </View>
      </View>

      <View style={styles.meta}>
        {familyLabel ? <Text style={styles.miniFamily}>{familyLabel}</Text> : null}
        <Text style={styles.miniName} numberOfLines={2}>{rec.perfume.name}</Text>
        <Text style={styles.miniBrand} numberOfLines={1}>{rec.perfume.brand}</Text>
      </View>
    </Pressable>
  );
}

// Section with horizontal carousel
function CarouselSection({
  eyebrow,
  title,
  items,
  onPressItem,
}: {
  eyebrow: string;
  title: string;
  items: Recommendation[];
  onPressItem: (id: string) => void;
}) {
  const { colors } = useTheme();
  if (items.length === 0) return null;

  return (
    <View style={{ gap: SPACING.md }}>
      <View style={{ paddingHorizontal: SPACING.xxl, gap: 2 }}>
        <Text style={{ fontFamily: FONTS.sansBold, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: colors.accent }}>
          {eyebrow}
        </Text>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.ink }}>
          {title}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xxl, gap: SPACING.md }}
      >
        {items.map((rec) => (
          <MiniCard key={rec.perfumeId} rec={rec} onPress={() => onPressItem(rec.perfumeId)} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scentDNA = useUserStore((state) => state.scentDNA);
  const profile = useUserStore((state) => state.profile);

  const [sections, setSections] = useState<ForYouSections | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const loadedKeyRef = useRef<string | null>(null);
  const quickActionAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const savedPostIds = useSocialPrefsStore((state) => state.savedPostIds);
  const archivedPostIds = useSocialPrefsStore((state) => state.archivedPostIds);
  const toggleSavedPost = useSocialPrefsStore((state) => state.toggleSavedPost);
  const visibleCommunityPosts = useMemo(
    () => communityPosts.filter((post) => !archivedPostIds.includes(post.id)),
    [archivedPostIds, communityPosts],
  );
  const communityFeaturedPost = visibleCommunityPosts[0] ?? null;
  const communityFeedPosts = visibleCommunityPosts.slice(1);

  const loadSections = useCallback(async () => {
    if (!scentDNA) return;
    const loadKey = `${language}|${profile?.genderPreference ?? "all"}|${scentDNA.profileTags.join("|")}`;
    if (loadedKeyRef.current === loadKey) return;
    loadedKeyRef.current = loadKey;
    try {
      const data = await getForYouSections(scentDNA, MOCK_WEATHER, language, profile?.genderPreference);
      setSections(data);
    } catch {
      loadedKeyRef.current = null;
    }
  }, [language, profile?.genderPreference, scentDNA]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  useEffect(() => {
    (async () => {
      const notifications = await listNotifications();
      setUnreadCount(notifications.filter((item) => !item.readAt).length);
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeNotifications(() => {
      void (async () => {
        const notifications = await listNotifications();
        setUnreadCount(notifications.filter((item) => !item.readAt).length);
      })();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    (async () => {
      const posts = await listCommunityPosts(12);
      setCommunityPosts(posts);
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityFeed(() => {
      void (async () => {
        const posts = await listCommunityPosts(12);
        setCommunityPosts(posts);
      })();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    quickActionAnims.forEach((anim) => anim.setValue(0));
    Animated.stagger(
      70,
      quickActionAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [quickActionAnims]);

  const go = (id: string) => router.push(`/perfume/${id}` as never);
  const firstName = profile?.fullName?.split(" ")[0] ?? t("home.youFallback");
  const dnaLabel = scentDNA?.bestFamilies?.[0] ?? null;
  const quickActions = [
    {
      key: "create",
      icon: "sparkle" as const,
      title: language === "tr" ? "Paylaşım Aç" : "Create Post",
      subtitle: language === "tr" ? "Topluluğa hızlı gönderi" : "Quick community post",
      onPress: () => router.push("/create-post" as never),
    },
    {
      key: "discover",
      icon: "discover" as const,
      title: language === "tr" ? "Keşfet" : "Discover",
      subtitle: language === "tr" ? "Yeni kokuları tara" : "Scan new scents",
      onPress: () => router.push("/(main)/discover" as never),
    },
    {
      key: "journal",
      icon: "sparkle" as const,
      title: language === "tr" ? "Koku Yazıları" : "Journal",
      subtitle: language === "tr" ? "Kısa rehberler" : "Short reads",
      onPress: () => router.push("/(main)/journal" as never),
    },
    {
      key: "collection",
      icon: "collection" as const,
      title: language === "tr" ? "Koleksiyonum" : "Collection",
      subtitle: language === "tr" ? "Durumları güncelle" : "Manage statuses",
      onPress: () => router.push("/(main)/collection" as never),
    },
  ];

  if (!scentDNA) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("home.profileMissingTitle")}</Text>
          <Text style={styles.emptyBody}>{t("home.profileMissingBody")}</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.replace("/(onboarding)/gender" as never)}>
            <Text style={styles.emptyCtaText}>{t("home.profileMissingCta")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hero = sections?.todaysPick[0] ?? null;
  const topMatchScore = sections?.bestMatches[0]?.matchScore ?? 0;
  const weatherEmoji = conditionEmoji(MOCK_WEATHER.condition);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greetWord(t)}, {MOCK_WEATHER.city}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.headerRight}>
            {dnaLabel && (
              <View style={styles.dnaPill}>
                <Text style={styles.dnaPillText}>{dnaLabel}</Text>
              </View>
            )}
            <Pressable style={styles.notifyButton} onPress={() => router.push("/notifications" as never)}>
              <TabBarIcon name="bell" color={colors.ink} size={17} />
              {unreadCount > 0 ? (
                <View style={styles.notifyBadge}>
                  <Text style={styles.notifyBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* Today's Pick hero */}
        <View style={{ paddingHorizontal: SPACING.xxl, gap: SPACING.sm }}>
          <Text style={styles.todayEyebrow}>{t("home.todayPick").toUpperCase()}</Text>
          {hero ? (
            <>
              <HeroCard rec={hero} onPress={() => go(hero.perfumeId)} />
              <Text style={styles.heroCaption}>
                {weatherEmoji} {MOCK_WEATHER.temp}°C · {sections?.todaysPickContext ?? "Bu koku bu anın atmosferiyle eşleştirildi."}
              </Text>
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderKicker}>
                {weatherEmoji} {MOCK_WEATHER.temp}°C · {MOCK_WEATHER.condition}
              </Text>
              <Text style={styles.heroPlaceholderTitle}>
                {language === "tr" ? "Günün kokusu hazırlanıyor" : "Preparing today's scent"}
              </Text>
              <Text style={styles.heroPlaceholderBody}>
                {language === "tr" ? "Profiline göre en doğru eşleşmeyi seçiyoruz." : "Choosing the strongest match for your profile."}
              </Text>
            </View>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          {quickActions.map((action, index) => {
            const anim = quickActionAnims[index] ?? quickActionAnims[0];
            return (
              <Animated.View
                key={action.key}
                style={{
                  opacity: anim,
                  transform: [{
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  }],
                }}
              >
                <Pressable style={styles.quickActionCard} onPress={action.onPress}>
                  <View style={styles.quickActionIcon}>
                    <TabBarIcon name={action.icon} color={colors.accent} size={14} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionSub}>{action.subtitle}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>

        {visibleCommunityPosts.length > 0 ? (
          <View style={styles.communitySection}>
            <View style={styles.communityHeader}>
              <View style={{ gap: 3, flex: 1 }}>
                <Text style={styles.communityEyebrow}>{language === "tr" ? "TOPLULUK" : "COMMUNITY"}</Text>
                <Text style={styles.communityTitle}>
                  {language === "tr" ? "Parfüm severlerin buluşma noktası" : "Where fragrance lovers meet"}
                </Text>
              </View>
              <Pressable onPress={() => router.push("/create-post" as never)}>
                <Text style={styles.communityAction}>{language === "tr" ? "Paylaş +" : "Share +"}</Text>
              </Pressable>
            </View>
            {communityFeaturedPost ? (
              <Pressable
                style={styles.communityFeaturedCard}
                onPress={() => router.push({ pathname: "/post/[id]", params: { id: communityFeaturedPost.id } } as never)}
              >
                <Text style={styles.communityCardMeta}>{communityFeaturedPost.authorName} · {communityFeaturedPost.type.toUpperCase()}</Text>
                {communityFeaturedPost.mediaUrl ? (
                  <View style={styles.communityFeaturedMediaWrap}>
                    <PerfumeVisual
                      perfume={{
                        id: communityFeaturedPost.perfumeId ?? communityFeaturedPost.id,
                        name: communityFeaturedPost.perfumeName ?? communityFeaturedPost.type,
                        brand: communityFeaturedPost.perfumeBrand ?? "Scentify",
                        gender: "unisex",
                        topNotes: [],
                        midNotes: [],
                        baseNotes: [],
                        families: ["Fresh"],
                        longevity: 0,
                        projection: 0,
                        seasons: [],
                        occasions: [],
                        impressions: [],
                        priceRange: "$$",
                        scentVector: [],
                      }}
                      height={184}
                      variant="card"
                    />
                  </View>
                ) : null}
                <Text style={styles.communityFeaturedBody} numberOfLines={4}>{communityFeaturedPost.caption}</Text>
                <Text style={styles.communityCardFoot}>
                  {communityFeaturedPost.likeCount} ♥ · {communityFeaturedPost.commentCount} 💬
                </Text>
                <View style={styles.communityActionsRow}>
                  <Pressable
                    style={styles.communityActionPill}
                    onPress={(event) => {
                      event.stopPropagation();
                      router.push({ pathname: "/post/[id]", params: { id: communityFeaturedPost.id, focusComment: "1" } } as never);
                    }}
                  >
                    <Text style={styles.communityActionPillText}>{language === "tr" ? "Yorum Yap" : "Comment"}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.communityActionPill}
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleSavedPost(communityFeaturedPost.id);
                    }}
                  >
                    <Text style={styles.communityActionPillText}>
                      {savedPostIds.includes(communityFeaturedPost.id)
                        ? language === "tr" ? "Kaydedildi" : "Saved"
                        : language === "tr" ? "Kaydet" : "Save"}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            ) : null}
            <View style={styles.communityList}>
              {communityFeedPosts.map((post) => (
                <Pressable
                  key={post.id}
                  onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } } as never)}
                  style={styles.communityCard}
                >
                  <Text style={styles.communityCardMeta}>{post.authorName} · {post.type.toUpperCase()}</Text>
                  {post.mediaUrl ? (
                    <View style={styles.communityMediaWrap}>
                      <PerfumeVisual
                        perfume={{
                          id: post.perfumeId ?? post.id,
                          name: post.perfumeName ?? post.type,
                          brand: post.perfumeBrand ?? "Scentify",
                          gender: "unisex",
                          topNotes: [],
                          midNotes: [],
                          baseNotes: [],
                          families: ["Fresh"],
                          longevity: 0,
                          projection: 0,
                          seasons: [],
                          occasions: [],
                          impressions: [],
                          priceRange: "$$",
                          scentVector: [],
                        }}
                        height={120}
                        variant="thumb"
                      />
                    </View>
                  ) : null}
                  <Text style={styles.communityCardBody} numberOfLines={2}>{post.caption}</Text>
                  <Text style={styles.communityCardFoot}>
                    {post.likeCount} ♥ · {post.commentCount} 💬
                  </Text>
                  <View style={styles.communityActionsRow}>
                    <Pressable
                      style={styles.communityActionPill}
                      onPress={(event) => {
                        event.stopPropagation();
                        router.push({ pathname: "/post/[id]", params: { id: post.id, focusComment: "1" } } as never);
                      }}
                    >
                      <Text style={styles.communityActionPillText}>{language === "tr" ? "Yorum Yap" : "Comment"}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.communityActionPill}
                      onPress={(event) => {
                        event.stopPropagation();
                        toggleSavedPost(post.id);
                      }}
                    >
                      <Text style={styles.communityActionPillText}>
                        {savedPostIds.includes(post.id)
                          ? language === "tr" ? "Kaydedildi" : "Saved"
                          : language === "tr" ? "Kaydet" : "Save"}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {sections ? (
          <>
            <CarouselSection
              eyebrow={`SCENT DNA · %${topMatchScore} UYUM`}
              title={t("home.sections.bestMatches")}
              items={sections.bestMatches}
              onPressItem={go}
            />

            {sections.freshDaily.length >= 2 && (
              <CarouselSection
                eyebrow={`${MOCK_WEATHER.temp}°C İÇİN · GÜNLÜK TAZE`}
                title={t("home.sections.freshDaily")}
                items={sections.freshDaily}
                onPressItem={go}
              />
            )}

            {sections.forNightOut.length >= 2 && (
              <CarouselSection
                eyebrow="AKŞAM RİTMİ · GECE SEÇİMİ"
                title={t("home.sections.evening")}
                items={sections.forNightOut}
                onPressItem={go}
              />
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const heroStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    card: {
      borderRadius: RADIUS.xl,
      overflow: "hidden",
      ...SHADOWS.lift,
    },
    heroImage: {
      position: "absolute",
      right: -20,
      bottom: 0,
      width: "70%",
      height: "100%",
    },
    overlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "65%",
    },
    badge: {
      position: "absolute",
      top: SPACING.md,
      left: SPACING.md,
      backgroundColor: colors.accent,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: 4,
    },
    badgeText: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      color: "#FFF8F1",
      letterSpacing: 0.5,
    },
    info: {
      position: "absolute",
      bottom: SPACING.lg,
      left: SPACING.lg,
      right: 64,
      gap: 2,
    },
    family: {
      fontFamily: FONTS.sansBold,
      fontSize: 9,
      letterSpacing: 2,
      color: "rgba(255,248,241,0.72)",
    },
    perfumeName: {
      fontFamily: FONTS.serif,
      fontSize: 26,
      color: "#FFF8F1",
      lineHeight: 30,
    },
    brandName: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: "rgba(255,248,241,0.72)",
    },
    arrow: {
      position: "absolute",
      bottom: SPACING.lg,
      right: SPACING.lg,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,248,241,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,248,241,0.28)",
      alignItems: "center",
      justifyContent: "center",
    },
    arrowText: {
      fontSize: 18,
      color: "#FFF8F1",
    },
  });

const miniStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    card: {
      width: 148,
      gap: SPACING.sm,
    },
    visual: {
      height: 192,
      borderRadius: RADIUS.lg,
      overflow: "hidden",
    },
    image: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "90%",
    },
    miniOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "55%",
    },
    miniBadge: {
      position: "absolute",
      top: SPACING.sm,
      right: SPACING.sm,
      backgroundColor: colors.accent,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
    },
    miniBadgeText: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      color: "#FFF8F1",
    },
    meta: {
      gap: 2,
      paddingHorizontal: 2,
    },
    miniFamily: {
      fontFamily: FONTS.sansBold,
      fontSize: 9,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: colors.accent,
    },
    miniName: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
      lineHeight: 17,
    },
    miniBrand: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
  });

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xxxl + 16,
      gap: SPACING.xxxl,
    },
    header: {
      paddingHorizontal: SPACING.xxl,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: 4,
    },
    greeting: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 32,
      lineHeight: 38,
      color: colors.ink,
    },
    dnaPill: {
      backgroundColor: colors.accentLight,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.accentMid,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      marginBottom: 4,
    },
    dnaPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.accent,
    },
    notifyButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    notifyBadge: {
      position: "absolute",
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      paddingHorizontal: 4,
    },
    notifyBadgeText: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      color: "#FFF8F1",
    },
    todayEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
    },
    heroCaption: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
      textAlign: "center",
      fontStyle: "italic",
    },
    heroPlaceholder: {
      minHeight: 210,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: SPACING.xl,
      justifyContent: "center",
      gap: SPACING.sm,
    },
    heroPlaceholderKicker: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
      letterSpacing: 0.3,
    },
    heroPlaceholderTitle: {
      fontFamily: FONTS.serif,
      fontSize: 28,
      lineHeight: 33,
      color: colors.ink,
    },
    heroPlaceholderBody: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    quickActionsRow: {
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.sm,
      paddingTop: SPACING.sm,
    },
    quickActionCard: {
      width: 186,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    quickActionIcon: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.accentMid,
      backgroundColor: colors.accentLight,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.ink,
    },
    quickActionSub: {
      fontFamily: FONTS.sans,
      fontSize: 10,
      color: colors.inkMid,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.lg,
    },
    emptyTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
      textAlign: "center",
    },
    emptyBody: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
      lineHeight: 21,
    },
    emptyCta: {
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
    },
    emptyCtaText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: "#FFF8F1",
    },
    communitySection: {
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.md,
    },
    communityHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    communityEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
    },
    communityTitle: {
      fontFamily: FONTS.serif,
      fontSize: 24,
      lineHeight: 28,
      color: colors.ink,
    },
    communityAction: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.accent,
    },
    communityFeaturedCard: {
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      gap: 10,
    },
    communityFeaturedMediaWrap: {
      borderRadius: RADIUS.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    communityFeaturedBody: {
      fontFamily: FONTS.sansMedium,
      fontSize: 15,
      color: colors.ink,
      lineHeight: 22,
    },
    communityList: {
      gap: SPACING.md,
    },
    communityCard: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      gap: 8,
    },
    communityMediaWrap: {
      borderRadius: RADIUS.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    communityCardMeta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      letterSpacing: 0.8,
      color: colors.inkFaint,
      textTransform: "uppercase",
    },
    communityCardBody: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.ink,
      lineHeight: 19,
    },
    communityCardFoot: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    communityActionsRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 2,
    },
    communityActionPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    communityActionPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
  });
