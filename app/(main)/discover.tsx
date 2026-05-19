import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useTheme } from "@/components/theme/ThemeProvider";
import { BrandCard } from "@/components/perfume/BrandCard";
import { PerfumeCard } from "@/components/perfume/PerfumeCard";
import { PerfumerCard } from "@/components/perfume/PerfumerCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EntityVisual } from "@/components/ui/EntityVisual";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { getBrands, getPerfumers, getPerfumes, getPerfumesByFamily, getPerfumesPage, searchBrands, searchPerfumers, searchPerfumes } from "@/services/perfumes";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";
import { perfLog, perfNow } from "@/utils/perf";
import { localizeScentLabels } from "@/utils/scentLabels";
import type { Brand, Perfume, Perfumer } from "@/utils/types";

const DISCOVER_TABS = ["perfumes", "brands", "perfumers", "notes"] as const;
const DISCOVER_FILTERS = ["all", "Woody", "Floral", "Citrus", "Fresh", "Oriental", "Gourmand", "Aquatic", "Spicy", "Musk", "Powdery", "Leather", "Resinous"] as const;
type DiscoverTab = (typeof DISCOVER_TABS)[number];
type DiscoverFilter = (typeof DISCOVER_FILTERS)[number];

const PERFUME_PREVIEW = 8;
const PERFUME_GRID_PAGE_SIZE = 12;
const BRAND_PREVIEW = 6;
const PERFUMER_PREVIEW = 6;
const STAGGER_MS = 40;
const STAGGER_BASE_DURATION = 280;
const STAGGER_TRANSLATE_Y = 16;
const STAGGER_MAX_INDEX = 12;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function configureExpandLayoutAnimation(durationScale: number) {
  const duration = Math.max(160, Math.round(220 * durationScale));
  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

interface AnimatedListItemProps {
  index: number;
  durationScale: number;
  distanceScale: number;
  isReducedMotion: boolean;
  resetKey: string;
  children: React.ReactNode;
  style?: StyleSheetStyle;
}

type StyleSheetStyle = NonNullable<React.ComponentProps<typeof Animated.View>["style"]>;

function AnimatedListItem({
  index,
  durationScale,
  distanceScale,
  isReducedMotion,
  resetKey,
  children,
  style,
}: AnimatedListItemProps) {
  const progress = useRef(new Animated.Value(isReducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (isReducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const cappedIndex = Math.min(index, STAGGER_MAX_INDEX);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(160, Math.round(STAGGER_BASE_DURATION * durationScale)),
      delay: cappedIndex * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [progress, index, durationScale, isReducedMotion, resetKey]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [STAGGER_TRANSLATE_Y * distanceScale, 0],
        }),
      },
    ],
  };

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function buildBrandMood(brand: Brand, worksLabel: string, architecturalQuote: string, texturedQuote: string) {
  const country = brand.country ? brand.country.slice(0, 2).toUpperCase() : "FR";
  return {
    eyebrow: `${country} · ${brand.perfumeCount} ${worksLabel}`,
    quote: brand.tagline || (brand.perfumeCount > 20 ? architecturalQuote : texturedQuote),
  };
}

function buildPerfumerLine(
  perfumer: Perfumer,
  studioLabel: string,
  worksLabel: string,
  cityFallback: string,
  language: "tr" | "en",
) {
  const city = perfumer.city ?? perfumer.brands[0]?.split(" ")[0] ?? cityFallback;
  const signature = localizeScentLabels(perfumer.signatureFamilies.slice(0, 3), language).join(", ").toLowerCase();
  return `${city} ${studioLabel} · ${perfumer.perfumeCount} ${worksLabel} · ${signature}`;
}

function topFamilies(perfumes: Perfume[], limit = 3) {
  const counts = new Map<string, number>();

  perfumes.forEach((perfume) => {
    perfume.families.forEach((family) => {
      if (!family) return;
      counts.set(family, (counts.get(family) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([family]) => family);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapIndexForVelocity(offsetX: number, interval: number, velocityX: number, threshold: number) {
  const base = offsetX / interval;
  if (velocityX > threshold) return Math.floor(base) + 1;
  if (velocityX < -threshold) return Math.ceil(base) - 1;
  return Math.round(base);
}

export default function DiscoverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; q?: string }>();
  const { t, language } = useI18n();
  const motion = useMotionProfile();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Perfume[]>([]);
  const [brandResults, setBrandResults] = useState<Brand[]>([]);
  const [perfumerResults, setPerfumerResults] = useState<Perfumer[]>([]);
  const [featuredPerfumes, setFeaturedPerfumes] = useState<Perfume[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [featuredPerfumers, setFeaturedPerfumers] = useState<Perfumer[]>([]);
  const [activeDiscoverTab, setActiveDiscoverTab] = useState<DiscoverTab>("perfumes");
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>("all");
  const [didApplyParams, setDidApplyParams] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfumesExpanded, setPerfumesExpanded] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [perfumersExpanded, setPerfumersExpanded] = useState(false);
  const [perfumePage, setPerfumePage] = useState(0);
  const [perfumeGridPage, setPerfumeGridPage] = useState(0);
  const [perfumeHasMore, setPerfumeHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const feedMotionValue = useState(() => new Animated.Value(0))[0];
  const scrollY = useRef(new Animated.Value(0)).current;
  const momentumY = useRef(new Animated.Value(0)).current;
  const filterRequestIdRef = useRef(0);
  const brandSearchRowRef = useRef<ScrollView | null>(null);
  const perfumerSearchRowRef = useRef<ScrollView | null>(null);

  const loadFeatured = useCallback(async () => {
    const startedAt = perfNow();
    setIsLoadingFeatured(true);
    setError(null);
    try {
      const [brands, perfumers] = await Promise.all([
        getBrands(8),
        getPerfumers(8),
      ]);
      setFeaturedBrands(brands);
      setFeaturedPerfumers(perfumers);
    } catch {
      setError(t("common.errorBody"));
    } finally {
      setIsLoadingFeatured(false);
      perfLog("discover.loadFeaturedMeta", startedAt, { brands: 8, perfumers: 8 });
    }
  }, [t]);

  const applyPerfumeFilter = useCallback(async (filter: DiscoverFilter) => {
    const startedAt = perfNow();
    const requestId = filterRequestIdRef.current + 1;
    filterRequestIdRef.current = requestId;

    setIsApplyingFilter(true);
    setError(null);
    setFeaturedPerfumes([]);
    setPerfumeHasMore(true);
    setPerfumePage(0);

    try {
      const { data, hasMore } = filter === "all"
        ? await getPerfumesPage(0)
        : await getPerfumesByFamily(filter, 0);

      if (filterRequestIdRef.current !== requestId) return;
      setFeaturedPerfumes(data);
      setPerfumeHasMore(hasMore);
      setPerfumePage(0);
      perfLog("discover.applyFilter", startedAt, { filter, perfumes: data.length });
    } catch {
      if (filterRequestIdRef.current !== requestId) return;
      setError(t("common.errorBody"));
      perfLog("discover.applyFilter.error", startedAt, { filter });
    } finally {
      if (filterRequestIdRef.current === requestId) {
        setIsApplyingFilter(false);
      }
    }
  }, [t]);

  const loadMorePerfumes = useCallback(async (): Promise<boolean> => {
    if (isLoadingMore || !perfumeHasMore || isApplyingFilter) return false;
    setIsLoadingMore(true);
    let appendedCount = 0;
    try {
      const nextPage = perfumePage + 1;
      const { data, hasMore } = activeFilter === "all"
        ? await getPerfumesPage(nextPage)
        : await getPerfumesByFamily(activeFilter, nextPage);
      setFeaturedPerfumes((prev) => [...prev, ...data]);
      setPerfumePage(nextPage);
      setPerfumeHasMore(hasMore);
      appendedCount = data.length;
    } catch {
      appendedCount = 0;
    } finally { setIsLoadingMore(false); }
    return appendedCount > 0;
  }, [activeFilter, isApplyingFilter, isLoadingMore, perfumeHasMore, perfumePage]);

  const loadSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setBrandResults([]);
      setPerfumerResults([]);
      return;
    }

    const startedAt = perfNow();
    try {
      const [perfumes, brands, perfumers] = await Promise.all([searchPerfumes(term), searchBrands(term), searchPerfumers(term)]);
      setResults(perfumes);
      setBrandResults(brands);
      setPerfumerResults(perfumers);
      setError(null);
      perfLog("discover.loadSearch", startedAt, { termLength: term.trim().length, perfumes: perfumes.length });
    } catch {
      setError(t("common.errorBody"));
      perfLog("discover.loadSearch.error", startedAt, { termLength: term.trim().length });
    }
  }, [t]);

  useEffect(() => {
    void loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    void applyPerfumeFilter(activeFilter);
  }, [activeFilter, applyPerfumeFilter]);

  useEffect(() => {
    if (didApplyParams) return;

    const maybeTab = params.tab;
    const maybeQuery = params.q;

    if (typeof maybeTab === "string") {
      const normalized = maybeTab.toLowerCase();
      const mapped =
        normalized === "perfumes" ? "perfumes"
          : normalized === "brands" ? "brands"
            : normalized === "perfumers" ? "perfumers"
              : normalized === "notes" ? "notes"
                : null;
      if (mapped) setActiveDiscoverTab(mapped);
    }
    if (typeof maybeQuery === "string" && maybeQuery.trim()) {
      setQuery(maybeQuery.trim());
    }

    setDidApplyParams(true);
  }, [didApplyParams, params.q, params.tab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadSearch, query]);

  useEffect(() => {
    if (!featuredPerfumes.length) return;
    featuredPerfumes
      .slice(0, 16)
      .map((item) => item.imageUrl)
      .filter((value): value is string => Boolean(value))
      .forEach((url) => {
        Image.prefetch(url).catch(() => undefined);
      });
  }, [featuredPerfumes]);

  const showSearch = Boolean(query.trim());
  const featuredBrandCards = featuredBrands;
  const perfumerRows = featuredPerfumers;
  const tabLabels: Record<DiscoverTab, string> = {
    perfumes: t("discover.tabs.perfumes"),
    brands: t("discover.tabs.brands"),
    perfumers: t("discover.tabs.perfumers"),
    notes: t("discover.tabs.notes"),
  };
  const filterLabels: Record<DiscoverFilter, string> = {
    all: t("discover.filters.all"),
    Woody: localizeScentLabels(["Woody"], language)[0],
    Floral: localizeScentLabels(["Floral"], language)[0],
    Citrus: localizeScentLabels(["Citrus"], language)[0],
    Fresh: localizeScentLabels(["Fresh"], language)[0],
    Oriental: localizeScentLabels(["Oriental"], language)[0],
    Gourmand: localizeScentLabels(["Gourmand"], language)[0],
    Aquatic: localizeScentLabels(["Aquatic"], language)[0],
    Spicy: localizeScentLabels(["Spicy"], language)[0],
    Musk: language === "tr" ? "Misk" : "Musk",
    Powdery: localizeScentLabels(["Powdery"], language)[0],
    Leather: localizeScentLabels(["Leather"], language)[0],
    Resinous: localizeScentLabels(["Resinous"], language)[0],
  };
  const openFilterPicker = useCallback(() => {
    const options = DISCOVER_FILTERS.map((style) => filterLabels[style]);
    const cancelLabel = language === "tr" ? "Vazgeç" : "Cancel";

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: language === "tr" ? "Aile filtresi seç" : "Choose family filter",
          options: [...options, cancelLabel],
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          if (buttonIndex >= 0 && buttonIndex < DISCOVER_FILTERS.length) {
            triggerHaptic("selection").catch(() => undefined);
            setActiveFilter(DISCOVER_FILTERS[buttonIndex]);
          }
        },
      );
      return;
    }

    const nextIndex = (DISCOVER_FILTERS.indexOf(activeFilter) + 1) % DISCOVER_FILTERS.length;
    Alert.alert(
      language === "tr" ? "Filtre güncellendi" : "Filter updated",
      options[nextIndex],
    );
    triggerHaptic("selection").catch(() => undefined);
    setActiveFilter(DISCOVER_FILTERS[nextIndex]);
  }, [activeFilter, filterLabels, language]);
  useEffect(() => {
    feedMotionValue.setValue(0);
    Animated.timing(feedMotionValue, {
      toValue: 1,
      duration: Math.max(180, Math.round(320 * motion.durationScale)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeDiscoverTab, activeFilter, feedMotionValue, motion.durationScale, showSearch]);

  // Reset expansion when tab/filter/search context changes
  useEffect(() => {
    setPerfumesExpanded(false);
    setBrandsExpanded(false);
    setPerfumersExpanded(false);
    setPerfumeGridPage(0);
  }, [activeDiscoverTab, activeFilter, showSearch]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setBrandResults([]);
    setPerfumerResults([]);
    triggerHaptic("selection").catch(() => undefined);
  }, []);

  const discoverLensCopy = language === "tr"
    ? {
      title: "Keşif lensi",
      subtitle: "Bu akış, aktif filtre ve sekmeye göre anlık olarak yeniden kürate edilir.",
      method: "Sıralama; nota uyumu, çeşitlilik ve genel performans dengesiyle yapılır.",
      bottles: "şişe",
      longevity: "Ort. kalıcılık",
      projection: "Ort. yayılım",
      dominantFamilies: "Baskın aileler",
      fallbackFamily: "Karışık profil",
      viewAll: "Tümünü Görüntüle",
      collapse: "Daralt",
    }
    : {
      title: "Discovery lens",
      subtitle: "This feed is dynamically re-curated based on your active filter and tab.",
      method: "Ranking blends note alignment, profile diversity, and overall performance balance.",
      bottles: "bottles",
      longevity: "Avg longevity",
      projection: "Avg projection",
      dominantFamilies: "Dominant families",
      fallbackFamily: "Mixed profile",
      viewAll: "View All",
      collapse: "Collapse",
    };

  const expandLabels = useMemo(() => {
    return language === "tr"
      ? {
        perfumes: (n: number) => `Tüm Parfümleri Görüntüle (${n})`,
        brands: (n: number) => `Tüm Markaları Görüntüle (${n})`,
        perfumers: (n: number) => `Tüm Yaratıcıları Görüntüle (${n})`,
        collapse: "Daralt",
        viewAllShort: "Tümünü Gör",
      }
      : {
        perfumes: (n: number) => `View All Perfumes (${n})`,
        brands: (n: number) => `View All Brands (${n})`,
        perfumers: (n: number) => `View All Perfumers (${n})`,
        collapse: "Collapse",
        viewAllShort: "View all",
      };
  }, [language]);

  const filteredFeaturedPerfumes = useMemo(() => featuredPerfumes, [featuredPerfumes]);

  const noteDrivenPerfumes = useMemo(() => {
    if (activeFilter !== "all") return filteredFeaturedPerfumes;
    return featuredPerfumes.filter((perfume) => perfume.topNotes.length > 0 || perfume.midNotes.length > 0 || perfume.baseNotes.length > 0);
  }, [activeFilter, featuredPerfumes, filteredFeaturedPerfumes]);
  const filteredSearchResults = useMemo(() => {
    if (activeFilter === "all") return results;
    return results.filter((perfume) => perfume.families.some((family) => family.toLowerCase() === activeFilter.toLowerCase()));
  }, [activeFilter, results]);
  const lensPerfumePool = useMemo(() => {
    if (activeDiscoverTab === "notes") return noteDrivenPerfumes;
    return filteredFeaturedPerfumes;
  }, [activeDiscoverTab, filteredFeaturedPerfumes, noteDrivenPerfumes]);
  const lensAverageLongevity = useMemo(() => {
    if (lensPerfumePool.length === 0) return 0;
    const totalLongevity = lensPerfumePool.reduce((sum, perfume) => sum + perfume.longevity, 0);
    return Math.round((totalLongevity / lensPerfumePool.length) * 10) / 10;
  }, [lensPerfumePool]);
  const lensAverageProjection = useMemo(() => {
    if (lensPerfumePool.length === 0) return 0;
    const totalProjection = lensPerfumePool.reduce((sum, perfume) => sum + perfume.projection, 0);
    return Math.round((totalProjection / lensPerfumePool.length) * 10) / 10;
  }, [lensPerfumePool]);
  const lensFamilies = useMemo(() => topFamilies(lensPerfumePool, 3), [lensPerfumePool]);

  const totalPerfumeGridPages = useMemo(
    () => Math.max(1, Math.ceil(filteredFeaturedPerfumes.length / PERFUME_GRID_PAGE_SIZE)),
    [filteredFeaturedPerfumes.length],
  );
  const visiblePerfumes = useMemo(() => {
    const safePage = Math.min(perfumeGridPage, totalPerfumeGridPages - 1);
    const start = safePage * PERFUME_GRID_PAGE_SIZE;
    return filteredFeaturedPerfumes.slice(start, start + PERFUME_GRID_PAGE_SIZE);
  }, [filteredFeaturedPerfumes, perfumeGridPage, totalPerfumeGridPages]);

  const visibleBrands = useMemo(() => {
    if (brandsExpanded) return featuredBrandCards;
    return featuredBrandCards.slice(0, BRAND_PREVIEW);
  }, [featuredBrandCards, brandsExpanded]);

  const visiblePerfumers = useMemo(() => {
    if (perfumersExpanded) return perfumerRows;
    return perfumerRows.slice(0, PERFUMER_PREVIEW);
  }, [perfumerRows, perfumersExpanded]);

  const visibleNotePerfumes = useMemo(() => {
    if (perfumesExpanded) return noteDrivenPerfumes;
    return noteDrivenPerfumes.slice(0, PERFUME_PREVIEW);
  }, [noteDrivenPerfumes, perfumesExpanded]);

  useEffect(() => {
    if (perfumeGridPage > totalPerfumeGridPages - 1) {
      setPerfumeGridPage(Math.max(0, totalPerfumeGridPages - 1));
    }
  }, [perfumeGridPage, totalPerfumeGridPages]);

  const togglePerfumes = useCallback(() => {
    configureExpandLayoutAnimation(motion.durationScale);
    setPerfumesExpanded((prev) => !prev);
  }, [motion.durationScale]);

  const toggleBrands = useCallback(() => {
    configureExpandLayoutAnimation(motion.durationScale);
    setBrandsExpanded((prev) => !prev);
  }, [motion.durationScale]);

  const togglePerfumers = useCallback(() => {
    configureExpandLayoutAnimation(motion.durationScale);
    setPerfumersExpanded((prev) => !prev);
  }, [motion.durationScale]);

  // Stable reset keys so AnimatedListItem replays stagger when content swaps
  const perfumesResetKey = `${activeFilter}|grid-${perfumeGridPage}|${filteredFeaturedPerfumes.length}`;
  const brandsResetKey = `${brandsExpanded ? "all" : "preview"}|${featuredBrandCards.length}`;
  const perfumersResetKey = `${perfumersExpanded ? "all" : "preview"}|${perfumerRows.length}`;
  const notesResetKey = `${activeFilter}|${perfumesExpanded ? "all" : "preview"}|${noteDrivenPerfumes.length}`;
  const searchPerfumesResetKey = `search-perfumes|${query}|${activeFilter}|${filteredSearchResults.length}`;
  const searchNotesResetKey = `search-notes|${query}|${activeFilter}|${filteredSearchResults.length}`;

  function applyMomentumImpulse(velocityY: number) {
    if (!motion.enableInertia) {
      momentumY.setValue(0);
      return;
    }

    const impulse = clamp(velocityY, -2.8, 2.8) * 9 * motion.distanceScale;
    momentumY.stopAnimation();
    momentumY.setValue(impulse);
    Animated.timing(momentumY, {
      toValue: 0,
      duration: Math.max(220, Math.round(560 * motion.durationScale)),
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  function handleScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    applyMomentumImpulse(velocityY);
  }

  function handleMomentumScrollBegin(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    applyMomentumImpulse(velocityY);
  }

  function handleMomentumScrollEnd() {
    momentumY.stopAnimation();
    momentumY.setValue(0);
  }

  function handleHorizontalEndDrag(
    ref: { current: ScrollView | null },
    interval: number,
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const velocityX = event.nativeEvent.velocity?.x ?? 0;
    const offsetX = event.nativeEvent.contentOffset.x;
    const threshold = motion.level === "high" ? 0.28 : 0.36;
    const targetIndex = Math.max(0, snapIndexForVelocity(offsetX, interval, velocityX, threshold));
    const targetX = targetIndex * interval;

    ref.current?.scrollTo({ x: targetX, animated: true });
  }

  const feedMotionStyle = {
    opacity: feedMotionValue.interpolate({
      inputRange: [0, 1],
      outputRange: [motion.isReducedMotion ? 0.75 : 0.2, 1],
    }),
    transform: [
      {
        translateY: feedMotionValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const headerParallaxStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 120],
          outputRange: [0, -20 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
      {
        translateY: momentumY.interpolate({
          inputRange: [-30, 30],
          outputRange: [2.4 * motion.parallaxScale, -2.4 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
    ],
    opacity: scrollY.interpolate({
      inputRange: [0, 90],
      outputRange: [1, motion.isReducedMotion ? 0.9 : 0.78],
      extrapolate: "clamp",
    }),
  };
  const searchParallaxStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 140],
          outputRange: [0, -10 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
      {
        translateY: momentumY.interpolate({
          inputRange: [-30, 30],
          outputRange: [1.4 * motion.parallaxScale, -1.4 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
    ],
  };
  const segmentedParallaxStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 160],
          outputRange: [0, -6 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
      {
        translateY: momentumY.interpolate({
          inputRange: [-30, 30],
          outputRange: [1.1 * motion.parallaxScale, -1.1 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
    ],
  };
  const reload = () => {
    if (showSearch) {
      void loadSearch(query);
      return;
    }
    void Promise.all([loadFeatured(), applyPerfumeFilter(activeFilter)]);
  };
  const isFeaturedTabEmpty =
    (!showSearch && !isLoadingFeatured && !isApplyingFilter && !error && activeDiscoverTab === "perfumes" && filteredFeaturedPerfumes.length === 0) ||
    (!showSearch && !isLoadingFeatured && !error && activeDiscoverTab === "brands" && featuredBrandCards.length === 0) ||
    (!showSearch && !isLoadingFeatured && !error && activeDiscoverTab === "perfumers" && perfumerRows.length === 0) ||
    (!showSearch && !isLoadingFeatured && !isApplyingFilter && !error && activeDiscoverTab === "notes" && noteDrivenPerfumes.length === 0);

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.ink }}>
          {t("common.errorTitle")}
        </Text>
        <Text style={{ fontFamily: FONTS.sans, fontSize: 15, color: colors.inkMid, textAlign: "center" }}>
          {error}
        </Text>
        <Button title={t("common.retry")} variant="ghost" onPress={reload} />
      </SafeAreaView>
    );
  }

  const renderExpandToggle = (
    expanded: boolean,
    totalCount: number,
    previewCount: number,
    onToggle: () => void,
    expandLabelBuilder: (n: number) => string,
    isPerfumeSection = false,
  ) => {
    if (!expanded && totalCount <= previewCount) return null;
    return (
      <View style={styles.expandWrap}>
        {!expanded ? (
          <Pressable
            onPress={onToggle}
            style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={styles.expandLabel}>{expandLabelBuilder(totalCount)}</Text>
          </Pressable>
        ) : (
          <View style={{ gap: SPACING.sm }}>
            <Pressable
              onPress={onToggle}
              style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
            >
              <Text style={styles.expandLabel}>{expandLabels.collapse} ↑</Text>
            </Pressable>
            {isPerfumeSection && perfumeHasMore && (
              <Pressable
                onPress={loadMorePerfumes}
                style={({ pressed }) => [styles.expandButton, { backgroundColor: colors.accent }, pressed && styles.expandButtonPressed]}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.expandLabel, { color: "#fff" }]}>Daha Fazla Yükle ({featuredPerfumes.length}+ parfüm)</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderPerfumeBadge = (count: number) => (
    <View style={styles.countBadge}>
      <Text style={styles.countBadgeText}>{count}</Text>
    </View>
  );

  const canGoPrevPerfumePage = perfumeGridPage > 0;
  const canGoNextPerfumePage = perfumeGridPage < totalPerfumeGridPages - 1 || perfumeHasMore;

  const goPrevPerfumePage = useCallback(() => {
    if (!canGoPrevPerfumePage) return;
    setPerfumeGridPage((prev) => Math.max(0, prev - 1));
  }, [canGoPrevPerfumePage]);

  const goNextPerfumePage = useCallback(async () => {
    if (perfumeGridPage < totalPerfumeGridPages - 1) {
      setPerfumeGridPage((prev) => prev + 1);
      return;
    }
    if (!perfumeHasMore || isLoadingMore) return;
    const loaded = await loadMorePerfumes();
    if (loaded) {
      setPerfumeGridPage((prev) => prev + 1);
    }
  }, [isLoadingMore, loadMorePerfumes, perfumeGridPage, perfumeHasMore, totalPerfumeGridPages]);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate={motion.level === "high" ? "fast" : 0.992}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        <Animated.View style={[styles.header, headerParallaxStyle]}>
          <Text style={styles.eyebrow}>{t("discover.eyebrow")}</Text>
          <Text style={styles.title}>{t("discover.title")}</Text>
          <Text style={styles.subtitle}>{t("discover.subtitle")}</Text>
        </Animated.View>

        <Animated.View style={[styles.searchWrap, searchParallaxStyle]}>
          <View style={styles.searchBar}>
            <TabBarIcon name="discover" color={colors.inkFaint} size={18} />
            <TextInput
              placeholder={t("discover.searchPlaceholder")}
              placeholderTextColor={colors.inkFaint}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
            <Pressable
              style={styles.filterButton}
              onPress={openFilterPicker}
            >
              <TabBarIcon name="filter" color={colors.inkMid} size={16} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.segmentedWrap, segmentedParallaxStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentedRow}
            directionalLockEnabled
            disableIntervalMomentum
            decelerationRate={motion.level === "high" ? "fast" : "normal"}
          >
            {DISCOVER_TABS.map((tab) => {
              const isActive = activeDiscoverTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    triggerHaptic("selection").catch(() => undefined);
                    setActiveDiscoverTab(tab);
                  }}
                  style={[styles.segmentedTab, isActive && styles.segmentedTabActive]}
                >
                  <Text style={[styles.segmentedLabel, isActive && styles.segmentedLabelActive]}>{tabLabels[tab]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View style={segmentedParallaxStyle}>
          <View style={styles.filtersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            directionalLockEnabled
            disableIntervalMomentum
            decelerationRate={motion.level === "high" ? "fast" : "normal"}
          >
            {DISCOVER_FILTERS.map((style) => (
              <Chip
                key={style}
                label={filterLabels[style]}
                selected={activeFilter === style}
                tone={activeFilter === style ? "ink" : "accent"}
                onPress={() => {
                  triggerHaptic("selection").catch(() => undefined);
                  setActiveFilter(style);
                }}
              />
            ))}
          </ScrollView>
          </View>
        </Animated.View>

        <Animated.View style={feedMotionStyle}>
          {!showSearch ? (
            <View style={styles.lensWrap}>
              {lensPerfumePool.length > 0 ? (
                <Card variant="tinted" style={styles.lensCard}>
                  <Text style={styles.lensTitle}>{discoverLensCopy.title}</Text>
                  <Text style={styles.lensSubtitle}>{discoverLensCopy.subtitle}</Text>
                  <View style={styles.lensChipRow}>
                    <Chip label={`${lensPerfumePool.length} ${discoverLensCopy.bottles}`} selected tone="ink" size="sm" />
                    <Chip label={`${discoverLensCopy.longevity}: ${lensAverageLongevity}`} selected tone="success" size="sm" />
                    <Chip label={`${discoverLensCopy.projection}: ${lensAverageProjection}`} selected tone="accent" size="sm" />
                  </View>
                  <Text style={styles.lensFamiliesLabel}>
                    {discoverLensCopy.dominantFamilies}: {(lensFamilies.length > 0
                      ? localizeScentLabels(lensFamilies, language)
                      : [discoverLensCopy.fallbackFamily]).join(" · ")}
                  </Text>
                  <Text style={styles.lensMethod}>{discoverLensCopy.method}</Text>
                </Card>
              ) : (
                <Card variant="tinted" style={styles.lensCard}>
                  <Text style={styles.lensTitle}>{discoverLensCopy.title}</Text>
                  <Text style={styles.lensSubtitle}>
                    {language === "tr"
                      ? "Bu filtrede şu an sonuç görünmüyor. Tüm filtreye dönüp keşfi genişletebilirsin."
                      : "No visible results for this filter right now. Switch back to all to broaden discovery."}
                  </Text>
                  <View style={styles.lensChipRow}>
                    <Chip
                      label={language === "tr" ? "Tümü filtrele" : "Filter all"}
                      selected
                      tone="accent"
                      size="sm"
                      onPress={() => setActiveFilter("all")}
                    />
                  </View>
                </Card>
              )}
            </View>
          ) : null}

          {showSearch ? (
            <>
            <View style={styles.resultsHeaderWrap}>
              <Text style={styles.resultsHeader}>{t("discover.resultsFor")} &quot;{query}&quot;</Text>
            </View>

            {activeDiscoverTab === "perfumes" ? (
              filteredSearchResults.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.perfumeGrid}>
                    {filteredSearchResults.map((perfume, index) => (
                      <AnimatedListItem
                        key={perfume.id}
                        index={index}
                        durationScale={motion.durationScale}
                        distanceScale={motion.distanceScale}
                        isReducedMotion={motion.isReducedMotion}
                        resetKey={searchPerfumesResetKey}
                        style={styles.perfumeGridItem}
                      >
                        <PerfumeCard perfume={perfume} onPress={() => router.push(`/perfume/${perfume.id}` as never)} />
                      </AnimatedListItem>
                    ))}
                  </View>
                </View>
              ) : null
            ) : null}

            {activeDiscoverTab === "brands" ? (
              brandResults.length > 0 ? (
                <View style={styles.section}>
                  <ScrollView
                    ref={brandSearchRowRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sectionRow}
                    directionalLockEnabled
                    decelerationRate={motion.level === "high" ? "fast" : "normal"}
                    disableIntervalMomentum
                    snapToInterval={212}
                    snapToAlignment="start"
                    onScrollEndDrag={(event) => handleHorizontalEndDrag(brandSearchRowRef, 212, event)}
                  >
                    {brandResults.map((brand) => (
                      <BrandCard key={brand.id} brand={brand} onPress={() => router.push(`/brand/${brand.slug}` as never)} />
                    ))}
                  </ScrollView>
                </View>
              ) : null
            ) : null}

            {activeDiscoverTab === "perfumers" ? (
              perfumerResults.length > 0 ? (
                <View style={styles.section}>
                  <ScrollView
                    ref={perfumerSearchRowRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sectionRow}
                    directionalLockEnabled
                    decelerationRate={motion.level === "high" ? "fast" : "normal"}
                    disableIntervalMomentum
                    snapToInterval={222}
                    snapToAlignment="start"
                    onScrollEndDrag={(event) => handleHorizontalEndDrag(perfumerSearchRowRef, 222, event)}
                  >
                    {perfumerResults.map((perfumer) => (
                      <PerfumerCard key={perfumer.id} perfumer={perfumer} onPress={() => router.push(`/perfumer/${perfumer.slug}` as never)} />
                    ))}
                  </ScrollView>
                </View>
              ) : null
            ) : null}

            {activeDiscoverTab === "notes" ? (
              filteredSearchResults.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t("discover.matchingProfiles")}</Text>
                  </View>
                  <View style={styles.perfumeGrid}>
                    {filteredSearchResults.map((perfume, index) => (
                      <AnimatedListItem
                        key={perfume.id}
                        index={index}
                        durationScale={motion.durationScale}
                        distanceScale={motion.distanceScale}
                        isReducedMotion={motion.isReducedMotion}
                        resetKey={searchNotesResetKey}
                        style={styles.perfumeGridItem}
                      >
                        <PerfumeCard perfume={perfume} onPress={() => router.push(`/perfume/${perfume.id}` as never)} />
                      </AnimatedListItem>
                    ))}
                  </View>
                </View>
              ) : null
            ) : null}

            {((activeDiscoverTab === "perfumes" && filteredSearchResults.length === 0) ||
              (activeDiscoverTab === "brands" && brandResults.length === 0) ||
              (activeDiscoverTab === "perfumers" && perfumerResults.length === 0) ||
              (activeDiscoverTab === "notes" && filteredSearchResults.length === 0)) ? (
              <View style={styles.emptyResultsWrap}>
                <Card variant="flat" style={styles.emptyResultsCard}>
                  <View style={styles.emptyResultsIcon}>
                    <TabBarIcon name="discover" color={colors.accent} size={22} focused />
                  </View>
                  <Text style={styles.emptyResultsTitle}>{t("discover.emptyTitle")}</Text>
                  <Text style={styles.emptyResultsCopy}>{t("discover.emptyCopy")}</Text>
                  <View style={styles.emptyResultsActions}>
                    <Pressable style={styles.emptyResultsButton} onPress={clearSearch}>
                      <Text style={styles.emptyResultsButtonText}>{language === "tr" ? "Aramayı Temizle" : "Clear Search"}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.emptyResultsButton, styles.emptyResultsButtonPrimary]}
                      onPress={() => {
                        triggerHaptic("selection").catch(() => undefined);
                        clearSearch();
                        setActiveDiscoverTab("perfumes");
                        setActiveFilter("all");
                      }}
                    >
                      <Text style={[styles.emptyResultsButtonText, styles.emptyResultsButtonTextPrimary]}>
                        {language === "tr" ? "Keşfe Dön" : "Back to Discover"}
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              </View>
            ) : null}
            </>
          ) : null}

          {!showSearch && activeDiscoverTab === "perfumes" ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>{t("discover.sections.perfumeLibrary")}</Text>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleGroup}>
                    <Text style={styles.sectionTitle}>{t("discover.sections.popularBottles")}</Text>
                    {renderPerfumeBadge(filteredFeaturedPerfumes.length)}
                  </View>
                </View>
              </View>
              {isLoadingFeatured || isApplyingFilter ? (
                <View style={styles.perfumeGrid}>
                  <View style={{ width: "100%", alignItems: "center", paddingVertical: 32 }}>
                    <ActivityIndicator size={isApplyingFilter ? "small" : "large"} color={colors.accent} />
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.perfumeGrid}>
                    {visiblePerfumes.map((perfume, index) => (
                      <AnimatedListItem
                        key={perfume.id}
                        index={index}
                        durationScale={motion.durationScale}
                        distanceScale={motion.distanceScale}
                        isReducedMotion={motion.isReducedMotion}
                        resetKey={perfumesResetKey}
                        style={styles.perfumeGridItem}
                      >
                        <PerfumeCard perfume={perfume} onPress={() => router.push(`/perfume/${perfume.id}` as never)} />
                      </AnimatedListItem>
                    ))}
                  </View>
                  <View style={styles.perfumePagerWrap}>
                    <Pressable
                      onPress={goPrevPerfumePage}
                      disabled={!canGoPrevPerfumePage}
                      style={({ pressed }) => [
                        styles.perfumePagerButton,
                        !canGoPrevPerfumePage && styles.perfumePagerButtonDisabled,
                        pressed && canGoPrevPerfumePage && styles.expandButtonPressed,
                      ]}
                    >
                      <Text style={[styles.perfumePagerButtonLabel, !canGoPrevPerfumePage && styles.perfumePagerButtonLabelDisabled]}>
                        {language === "tr" ? "Önceki" : "Prev"}
                      </Text>
                    </Pressable>
                    <Text style={styles.perfumePagerMeta}>
                      {perfumeGridPage + 1} / {totalPerfumeGridPages}{isLoadingMore ? " · ..." : ""}
                    </Text>
                    <Pressable
                      onPress={() => void goNextPerfumePage()}
                      disabled={!canGoNextPerfumePage || isLoadingMore}
                      style={({ pressed }) => [
                        styles.perfumePagerButton,
                        (!canGoNextPerfumePage || isLoadingMore) && styles.perfumePagerButtonDisabled,
                        pressed && canGoNextPerfumePage && !isLoadingMore && styles.expandButtonPressed,
                      ]}
                    >
                      <Text style={[styles.perfumePagerButtonLabel, (!canGoNextPerfumePage || isLoadingMore) && styles.perfumePagerButtonLabelDisabled]}>
                        {isLoadingMore ? (language === "tr" ? "Yükleniyor" : "Loading") : (language === "tr" ? "Sonraki" : "Next")}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ) : null}

          {!showSearch && activeDiscoverTab === "brands" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>{t("discover.sections.housesInFocus")}</Text>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionTitle}>{t("discover.sections.featuredBrands")}</Text>
                  {renderPerfumeBadge(featuredBrandCards.length)}
                </View>
                {featuredBrandCards.length > BRAND_PREVIEW && !brandsExpanded ? (
                  <Pressable onPress={toggleBrands} hitSlop={8}>
                    <Text style={styles.sectionLink}>{expandLabels.viewAllShort} →</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.brandGrid}>
              {visibleBrands.map((brand, index) => {
                const mood = buildBrandMood(brand, t("discover.works"), t("discover.brandQuoteArchitectural"), t("discover.brandQuoteTexture"));
                const visualTone = index % 2 === 0 ? styles.brandVisualDark : styles.brandVisualSoft;

                return (
                  <AnimatedListItem
                    key={brand.id}
                    index={index}
                    durationScale={motion.durationScale}
                    distanceScale={motion.distanceScale}
                    isReducedMotion={motion.isReducedMotion}
                    resetKey={brandsResetKey}
                    style={styles.brandPressable}
                  >
                    <Pressable onPress={() => router.push(`/brand/${brand.slug}` as never)}>
                      <Card variant="default" style={styles.brandCard}>
                        <View style={[styles.brandVisual, visualTone]}>
                          <EntityVisual
                            imageUrl={brand.imageUrl ?? brand.heroImageUrl}
                            label={t("discover.brandVisualLabel")}
                            tone={index % 2 === 0 ? "ink" : "sand"}
                            height={148}
                          />
                          <View pointerEvents="none" style={styles.brandVisualScrim} />
                          <View style={styles.brandTarget}>
                            <View style={styles.brandTargetDot} />
                          </View>
                          <Text style={styles.brandVisualLabel}>{t("discover.brandVisualLabel")}</Text>
                        </View>
                        <Text style={styles.brandCardEyebrow}>{mood.eyebrow}</Text>
                        <Text style={styles.brandName}>{brand.name}</Text>
                        <Text style={styles.brandQuote}>"{mood.quote}"</Text>
                      </Card>
                    </Pressable>
                  </AnimatedListItem>
                );
              })}
            </View>
            {renderExpandToggle(
              brandsExpanded,
              featuredBrandCards.length,
              BRAND_PREVIEW,
              toggleBrands,
              expandLabels.brands,
            )}
          </View>
          ) : null}

          {!showSearch && activeDiscoverTab === "perfumers" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>{t("discover.sections.handsBehind")}</Text>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionTitle}>{t("discover.sections.creatorsToKnow")}</Text>
                  {renderPerfumeBadge(perfumerRows.length)}
                </View>
                {perfumerRows.length > PERFUMER_PREVIEW && !perfumersExpanded ? (
                  <Pressable onPress={togglePerfumers} hitSlop={8}>
                    <Text style={styles.sectionLink}>{expandLabels.viewAllShort} →</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.perfumerList}>
              {visiblePerfumers.map((perfumer, index) => (
                <AnimatedListItem
                  key={perfumer.id}
                  index={index}
                  durationScale={motion.durationScale}
                  distanceScale={motion.distanceScale}
                  isReducedMotion={motion.isReducedMotion}
                  resetKey={perfumersResetKey}
                >
                  <Pressable onPress={() => router.push(`/perfumer/${perfumer.slug}` as never)}>
                    <Card variant="default" style={styles.perfumerRowCard}>
                      {perfumer.portraitUrl ? (
                        <Image source={{ uri: perfumer.portraitUrl }} style={styles.perfumerAvatarImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.perfumerAvatar}>
                          <View style={styles.perfumerAvatarDot} />
                        </View>
                      )}
                      <View style={styles.perfumerContent}>
                        <Text style={styles.perfumerName}>{perfumer.name}</Text>
                        <Text style={styles.perfumerMeta}>
                          {buildPerfumerLine(perfumer, t("discover.studioLabel"), t("discover.works"), t("discover.defaultCity"), language)}
                        </Text>
                      </View>
                      <Text style={styles.perfumerIndex}>{String(index + 1).padStart(2, "0")}</Text>
                      <TabBarIcon name="chevron-right" color={colors.inkFaint} size={16} />
                    </Card>
                  </Pressable>
                </AnimatedListItem>
              ))}
            </View>
            {renderExpandToggle(
              perfumersExpanded,
              perfumerRows.length,
              PERFUMER_PREVIEW,
              togglePerfumers,
              expandLabels.perfumers,
            )}
          </View>
          ) : null}

          {!showSearch && activeDiscoverTab === "notes" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>{t("discover.sections.byNoteMood")}</Text>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionTitle}>{t("discover.sections.noteFirst")}</Text>
                  {renderPerfumeBadge(noteDrivenPerfumes.length)}
                </View>
                {noteDrivenPerfumes.length > PERFUME_PREVIEW && !perfumesExpanded ? (
                  <Pressable onPress={togglePerfumes} hitSlop={8}>
                    <Text style={styles.sectionLink}>{expandLabels.viewAllShort} →</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <View style={styles.perfumeGrid}>
              {visibleNotePerfumes.map((perfume, index) => (
                <AnimatedListItem
                  key={perfume.id}
                  index={index}
                  durationScale={motion.durationScale}
                  distanceScale={motion.distanceScale}
                  isReducedMotion={motion.isReducedMotion}
                  resetKey={notesResetKey}
                  style={styles.perfumeGridItem}
                >
                  <PerfumeCard perfume={perfume} onPress={() => router.push(`/perfume/${perfume.id}` as never)} />
                </AnimatedListItem>
              ))}
            </View>
            {renderExpandToggle(
              perfumesExpanded,
              noteDrivenPerfumes.length,
              PERFUME_PREVIEW,
              togglePerfumes,
              expandLabels.perfumes,
            )}
          </View>
          ) : null}

          {isFeaturedTabEmpty ? (
            <View style={styles.emptyResultsWrap}>
              <Card variant="flat" style={styles.emptyResultsCard}>
                <View style={styles.emptyResultsIcon}>
                  <TabBarIcon name="discover" color={colors.accent} size={22} focused />
                </View>
                <Text style={styles.emptyResultsTitle}>{t("discover.emptyTitle")}</Text>
                <Text style={styles.emptyResultsCopy}>{t("discover.emptyCopy")}</Text>
              </Card>
            </View>
          ) : null}
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingBottom: SPACING.section + 8,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
      gap: 5,
    },
    eyebrow: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: colors.inkMid,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 40,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      lineHeight: 21,
    },
    searchWrap: {
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    searchBar: {
      minHeight: 54,
      borderRadius: RADIUS.full,
      paddingLeft: 18,
      paddingRight: 9,
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    searchInput: {
      flex: 1,
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.ink,
    },
    filterButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentedWrap: {
      marginBottom: 7,
    },
    segmentedRow: {
      paddingHorizontal: 20,
      gap: 8,
    },
    segmentedTab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    segmentedTabActive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    segmentedLabel: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkFaint,
    },
    segmentedLabelActive: {
      color: colors.ink,
    },
    filtersWrap: {
      marginBottom: 8,
    },
    filtersRow: {
      paddingHorizontal: 20,
      gap: SPACING.sm,
    },
    lensWrap: {
      paddingHorizontal: 20,
      marginBottom: 4,
    },
    lensCard: {
      gap: 8,
      padding: 15,
      borderRadius: RADIUS.lg,
    },
    lensTitle: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: colors.accentDark,
    },
    lensSubtitle: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    lensChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 2,
    },
    lensFamiliesLabel: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      lineHeight: 17,
      color: colors.ink,
      marginTop: 2,
    },
    lensMethod: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkFaint,
    },
    section: {
      paddingBottom: 8,
      marginTop: 18,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      gap: 3,
      marginBottom: 10,
    },
    sectionEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 2,
      color: colors.inkFaint,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    sectionTitle: {
      fontFamily: FONTS.serif,
      fontSize: 21,
      color: colors.ink,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignSelf: "center",
      marginTop: 4,
    },
    countBadgeText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 11,
      color: colors.inkMid,
      letterSpacing: 0.4,
    },
    sectionLink: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.accent,
    },
    perfumePagerWrap: {
      marginTop: 14,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    perfumePagerButton: {
      minHeight: 42,
      borderRadius: RADIUS.full,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },
    perfumePagerButtonDisabled: {
      opacity: 0.45,
    },
    perfumePagerButtonLabel: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.ink,
      letterSpacing: 0.2,
    },
    perfumePagerButtonLabelDisabled: {
      color: colors.inkFaint,
    },
    perfumePagerMeta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
      letterSpacing: 0.3,
    },
    expandWrap: {
      paddingHorizontal: 20,
      marginTop: 14,
    },
    expandButton: {
      minHeight: 46,
      borderRadius: RADIUS.full,
      paddingHorizontal: 18,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },
    expandButtonPressed: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    expandLabel: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
      letterSpacing: 0.3,
    },
    brandGrid: {
      paddingHorizontal: 20,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    sectionRow: {
      paddingLeft: 20,
      paddingRight: 20,
      gap: 12,
    },
    brandPressable: {
      width: "48%",
    },
    brandCard: {
      padding: 10,
      gap: 8,
    },
    brandVisual: {
      height: 148,
      borderRadius: RADIUS.lg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: 4,
    },
    brandVisualScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(17,14,12,0.30)",
    },
    brandVisualDark: {
      backgroundColor: colors.heroSurface,
    },
    brandVisualSoft: {
      backgroundColor: colors.surfaceMuted,
    },
    brandTarget: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.7)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    brandTargetDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.85)",
    },
    brandVisualLabel: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: "rgba(255,255,255,0.72)",
      textTransform: "lowercase",
      letterSpacing: 0.3,
    },
    brandCardEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.7,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    brandName: {
      fontFamily: FONTS.serif,
      fontSize: 18,
      lineHeight: 22,
      color: colors.ink,
    },
    brandQuote: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    perfumerList: {
      paddingHorizontal: 20,
      gap: 10,
    },
    perfumerRowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    perfumerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.accentLight,
      alignItems: "center",
      justifyContent: "center",
    },
    perfumerAvatarImage: {
      width: 42,
      height: 42,
      borderRadius: 12,
    },
    perfumerAvatarDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.accentDark,
    },
    perfumerContent: {
      flex: 1,
      gap: 3,
    },
    perfumerName: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 16,
      color: colors.ink,
    },
    perfumerMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkMid,
      textTransform: "none",
    },
    perfumerIndex: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      color: colors.inkFaint,
      marginRight: 2,
    },
    resultsHeaderWrap: {
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 4,
    },
    resultsHeader: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 16,
      color: colors.ink,
    },
    perfumeGrid: {
      paddingHorizontal: 20,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 13,
    },
    perfumeGridItem: {
      width: "48%",
    },
    emptyResultsWrap: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    emptyResultsCard: {
      alignItems: "center",
      gap: 10,
    },
    emptyResultsIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
    },
    emptyResultsTitle: {
      fontFamily: FONTS.serif,
      fontSize: 24,
      color: colors.ink,
    },
    emptyResultsCopy: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      color: colors.inkMid,
    },
    emptyResultsActions: {
      width: "100%",
      marginTop: 8,
      gap: SPACING.sm,
    },
    emptyResultsButton: {
      minHeight: 42,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.lg,
    },
    emptyResultsButtonPrimary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    emptyResultsButtonText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
    },
    emptyResultsButtonTextPrimary: {
      color: "#FFF8F1",
    },
  });
