import { useRouter } from "expo-router";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { RadarChart } from "@/components/dna/RadarChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { StackHeader } from "@/components/ui/StackHeader";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS } from "@/utils/constants";
import { topDimensions } from "@/utils/helpers";
import { useI18n } from "@/utils/i18n";

const FAMILY_EXAMPLE_NOTES: Record<string, string> = {
  Fresh: "green tea, mint",
  Woody: "cedar, vetiver",
  Sweet: "praline, caramel",
  Citrus: "bergamot, lemon",
  Spicy: "pepper, cardamom",
  Aquatic: "sea spray, driftwood",
  Powdery: "iris, talc",
  Musky: "clean musk, white amber",
  Amber: "labdanum, benzoin",
  Vanilla: "vanilla bean, tonka",
  Leather: "suede, birch tar",
  Floral: "rose, jasmine",
  Smoky: "incense, birch",
  Oriental: "oud, saffron",
};

function capitalizeWord(value: string) {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;
}

function tokenizeDescriptor(value: string) {
  return value
    .split(/[\s/-]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
}

function buildDescriptor(families: string[], tags: string[]) {
  const lead = families[0] ?? tags[0] ?? "Resinous";
  const tail = families[1] ?? tags[1] ?? "Romantic";
  const words = [...tokenizeDescriptor(lead), ...tokenizeDescriptor(tail)];
  const seen = new Set<string>();
  const uniqueWords: string[] = [];

  words.forEach((word) => {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(capitalizeWord(word));
    }
  });

  return uniqueWords.slice(0, 4).join(" ");
}

function deriveResultTitle(families: string[], tags: string[], language: "tr" | "en") {
  const descriptor = buildDescriptor(families, tags);
  if (language === "tr") return descriptor || "Reçineli Romantik";
  return `The ${descriptor || "Resinous Romantic"}.`;
}

function buildFitReasons(bestFamilies: string[], language: "tr" | "en") {
  const uniqueFamilies = [...new Set(bestFamilies.filter(Boolean))];
  return uniqueFamilies.slice(0, 3).map((family, index) => {
    const notes = FAMILY_EXAMPLE_NOTES[family] ?? family;
    if (language === "tr") {
      if (index === 0) return `Koku tercihinde ${family.toLowerCase()} karakteri belirgin şekilde öne çıkıyor.`;
      if (index === 1) return `${family} tarafı profiline daha dengeli ve sakin bir yön kazandırıyor.`;
      return `${notes} çizgisi favorilerinde tekrar eden güçlü bir sinyal veriyor.`;
    }

    if (index === 0) return `Your choices repeatedly favor ${family.toLowerCase()} structures.`;
    if (index === 1) return `${family} facets add a smoother, composed direction to your profile.`;
    return `${notes} appears as a recurring signal across your favorites.`;
  });
}

function formatDimensionLabel(value: string) {
  return capitalizeWord(value);
}

export default function DNAResultScreen() {
  const router = useRouter();
  const { language } = useI18n();
  const motion = useMotionProfile();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const scentDNA = useUserStore((state) => state.scentDNA);
  const revealValue = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lovedCount = useOnboardingStore((state) => state.lovedPerfumeIds.length);
  const dislikedCount = useOnboardingStore((state) => state.dislikedPerfumeIds.length);
  const ownedCount = useOnboardingStore((state) => state.ownedPerfumeIds.length);
  const stylesCount = useOnboardingStore((state) => state.preferredStyles.length);
  const avoidCount = useOnboardingStore((state) => state.avoidNotes.length);
  const contextsCount = useOnboardingStore((state) => state.usageContexts.length);
  const hasIntensity = useOnboardingStore((state) => Boolean(state.intensityPreference));
  const hasBudget = useOnboardingStore((state) => Boolean(state.budgetPreference));
  const hasWeather = useOnboardingStore((state) => state.weatherEnabled);

  // Run reveal animation whenever the DNA profile identity changes (new onboarding result).
  // Using bestFamilies[0] as a stable identity proxy avoids re-firing on every object
  // reference change while still catching genuine DNA updates.
  const dnaIdentity = scentDNA?.bestFamilies[0] ?? null;
  useEffect(() => {
    revealValue.setValue(0);
    Animated.timing(revealValue, {
      toValue: 1,
      duration: Math.max(220, Math.round(460 * motion.durationScale)),
      useNativeDriver: true,
    }).start();
  }, [motion.durationScale, revealValue, dnaIdentity]);

  if (!scentDNA) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: colors.inkMid }}>
            {language === "tr" ? "Scent DNA hesaplanıyor…" : "Calculating your Scent DNA…"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = deriveResultTitle(scentDNA.bestFamilies, scentDNA.profileTags, language);
  const fitReasons = buildFitReasons(scentDNA.bestFamilies, language);
  const signatureTags = [...new Set([...scentDNA.bestFamilies, ...scentDNA.profileTags])].slice(0, 6);
  const topProfileDimensions = topDimensions(scentDNA, 6);
  const modelSignalCount =
    lovedCount +
    dislikedCount +
    ownedCount +
    stylesCount +
    avoidCount +
    contextsCount +
    (hasIntensity ? 1 : 0) +
    (hasBudget ? 1 : 0) +
    (hasWeather ? 1 : 0);
  const modelInputSummary = language === "tr"
    ? `${lovedCount} beğeni · ${dislikedCount} eleme · ${contextsCount} kullanım bağlamı · ${stylesCount} stil tercihi`
    : `${lovedCount} loves · ${dislikedCount} dislikes · ${contextsCount} usage contexts · ${stylesCount} style picks`;
  const copy = language === "tr"
    ? {
      headerTitle: "Scent DNA",
      headerSub: "Sonuç",
      resultEyebrow: "Sonucun",
      metaRight: "Scent DNA · v1",
      identityLead: "Profilin",
      summaryFallback: "Baharatlı, ferah ve amber derinliği taşıyan dengeli kompozisyonlara doğal olarak yöneliyorsun.",
      chartTitle: "Koku haritan",
      chartSubtitle: "Bu radar, en baskın 6 koku boyutunu 0-100 ölçeğinde gösterir.",
      chartMethodTitle: "Chart neye göre hesaplanıyor?",
      chartMethodBody: "Skorlar; sevdiğin ve elediğin şişeler, seçtiğin kullanım senaryoları, stil tercihlerin ve bütçe/yoğunluk kararlarından türetilir.",
      modelInputs: "Model girdileri",
      deepDive: "Detaylı analiz ekranı",
      signatureAccords: "İmza akorların",
      whyFits: "Neden sana uyuyor",
      cta: "Eşleşmelerimi göster",
    }
    : {
      headerTitle: "Scent DNA",
      headerSub: "Result",
      resultEyebrow: "Your result",
      metaRight: "Scent DNA · v1",
      identityLead: "You are",
      summaryFallback: "You naturally gravitate toward balanced compositions with fresh lift and warm depth.",
      chartTitle: "Your scent map",
      chartSubtitle: "This radar shows your top 6 scent dimensions on a 0-100 scale.",
      chartMethodTitle: "How this chart is calculated",
      chartMethodBody: "Scores are inferred from bottles you loved or rejected, your usage contexts, style picks, and your budget/intensity choices.",
      modelInputs: "Model inputs",
      deepDive: "Open detailed analysis",
      signatureAccords: "Your signature accords",
      whyFits: "Why this fits you",
      cta: "Show my matches",
    };
  const summary = scentDNA.summary?.trim() ? scentDNA.summary : copy.summaryFallback;
  const topReveal = {
    opacity: revealValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: revealValue.interpolate({
          inputRange: [0, 1],
          outputRange: [14 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const middleReveal = {
    opacity: revealValue.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0, 1],
    }),
    transform: [
      {
        translateY: revealValue.interpolate({
          inputRange: [0, 1],
          outputRange: [18 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const lowerReveal = {
    opacity: revealValue.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0, 0, 1],
    }),
    transform: [
      {
        translateY: revealValue.interpolate({
          inputRange: [0, 1],
          outputRange: [22 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const titleParallax = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 120],
          outputRange: [0, -14 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
    ],
  };
  const chartParallax = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 180],
          outputRange: [0, -10 * motion.parallaxScale],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <StackHeader title={copy.headerTitle} subtitle={copy.headerSub} />

        <View style={styles.topMetaRow}>
          <Text style={styles.eyebrow}>{copy.resultEyebrow}</Text>
          <Text style={styles.metaRight}>{copy.metaRight}</Text>
        </View>

        <Animated.View style={[styles.topSection, topReveal, titleParallax]}>
          <Text style={styles.title}>{copy.identityLead}</Text>
          <Text style={styles.titleAccent}>{title}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </Animated.View>

        <Animated.View style={[styles.chartSection, middleReveal, chartParallax]}>
          <Card variant="default" style={styles.chartCard}>
            <Text style={styles.sectionLabel}>{copy.chartTitle}</Text>
            <Text style={styles.chartSubtitle}>{copy.chartSubtitle}</Text>
            <RadarChart profile={scentDNA} />

            <View style={styles.dimensionRow}>
              {topProfileDimensions.slice(0, 4).map((item) => (
                <Chip
                  key={item.key}
                  label={`${formatDimensionLabel(item.key)} ${item.value}%`}
                  selected
                  tone="accent"
                  size="sm"
                />
              ))}
            </View>

            <Card variant="flat" style={styles.methodCard}>
              <Text style={styles.fitEyebrow}>{copy.chartMethodTitle}</Text>
              <Text style={styles.methodText}>{copy.chartMethodBody}</Text>
              <Text style={styles.methodMeta}>
                {copy.modelInputs}: {modelSignalCount}
              </Text>
              <Text style={styles.methodMetaSoft}>{modelInputSummary}</Text>
            </Card>
          </Card>
        </Animated.View>

        <View style={styles.familiesSection}>
          <Text style={styles.sectionLabel}>{copy.signatureAccords}</Text>
          <View style={styles.tagsRow}>
            {signatureTags.map((tag) => (
              <Chip key={tag} label={tag} selected tone="accent" />
            ))}
          </View>
        </View>

        <Animated.View style={[styles.fitSection, lowerReveal]}>
          <Card variant="flat" style={styles.fitCard}>
            <Text style={styles.fitEyebrow}>{copy.whyFits}</Text>
            {fitReasons.map((line, index) => (
              <View key={`${line}-${index}`} style={styles.fitRow}>
                <Text style={styles.fitIndex}>{String(index + 1).padStart(2, "0")}</Text>
                <Text style={styles.fitCopy}>{line}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View style={[styles.ctaSection, lowerReveal]}>
          <Button title={copy.deepDive} variant="ghost" onPress={() => router.push("/dna/detail" as never)} />
        </Animated.View>

        <Animated.View style={[styles.ctaSection, lowerReveal]}>
          <Button title={copy.cta} variant="copper" onPress={() => router.replace("/(main)" as never)} />
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
    scroll: {
      paddingBottom: 54,
      gap: 24,
    },
    topMetaRow: {
      paddingHorizontal: 20,
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    topSection: {
      marginHorizontal: 20,
      marginTop: 2,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 7,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 2.5,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    metaRight: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 30,
      lineHeight: 34,
      color: colors.ink,
    },
    titleAccent: {
      fontFamily: FONTS.serif,
      fontSize: 44,
      lineHeight: 48,
      color: colors.accent,
    },
    summary: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 24,
      color: colors.inkMid,
      marginTop: 7,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chartSection: {
      paddingHorizontal: 20,
    },
    chartCard: {
      gap: 12,
      padding: 18,
    },
    chartSubtitle: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.inkMid,
      marginTop: -2,
    },
    dimensionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    methodCard: {
      gap: 8,
      padding: 12,
    },
    methodText: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    methodMeta: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: colors.ink,
    },
    methodMetaSoft: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkFaint,
    },
    familiesSection: {
      paddingHorizontal: 20,
      gap: 12,
    },
    sectionLabel: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    fitSection: {
      paddingHorizontal: 20,
    },
    fitCard: {
      gap: 12,
      padding: 15,
    },
    fitEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
    },
    fitRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    fitIndex: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      color: colors.inkFaint,
      paddingTop: 2,
    },
    fitCopy: {
      flex: 1,
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.inkMid,
    },
    ctaSection: {
      paddingHorizontal: 20,
      marginTop: -6,
    },
  });
