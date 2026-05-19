import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EditorialVisual } from "@/components/ui/EditorialVisual";
import { Input } from "@/components/ui/Input";
import { editorialArticles } from "@/services/editorial";
import { FONTS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

const CATEGORY_FILTERS = ["All", "Wear", "Notes", "Houses", "Craft", "Care"] as const;

export default function JournalScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [activeFilter, setActiveFilter] = useState<(typeof CATEGORY_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const filterLabel = (key: (typeof CATEGORY_FILTERS)[number]): string => {
    const map: Record<(typeof CATEGORY_FILTERS)[number], string> = {
      All: t("journal.filters.all"),
      Wear: t("journal.filters.wear"),
      Notes: t("journal.filters.notes"),
      Houses: t("journal.filters.houses"),
      Craft: t("journal.filters.craft"),
      Care: t("journal.filters.care"),
    };
    return map[key];
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return editorialArticles.filter((article) => {
      const matchesCategory = activeFilter === "All" || article.category === activeFilter;
      if (!matchesCategory) return false;
      if (!normalized) return true;

      const haystack = [
        article.title,
        article.subtitle,
        article.excerpt,
        article.category,
        ...article.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [activeFilter, query]);

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t("journal.eyebrow")}</Text>
          <Text style={styles.title}>{t("journal.title")}</Text>
          <Text style={styles.subtitle}>{t("journal.subtitle")}</Text>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CATEGORY_FILTERS.map((filter) => (
              <Chip
                key={filter}
                label={filterLabel(filter)}
                selected={activeFilter === filter}
                tone={activeFilter === filter ? "ink" : "accent"}
                onPress={() => setActiveFilter(filter)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.searchWrap}>
          <Input
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t("journal.searchPlaceholder")}
            returnKeyType="search"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("journal.latestPieces")}</Text>
            <Text style={styles.sectionMeta}>{filtered.length} {t("journal.storiesSuffix")}</Text>
          </View>

          {featured ? (
            <Pressable onPress={() => router.push(`/journal/${featured.slug}` as never)} style={styles.featuredWrap}>
              <Card variant="default" style={styles.featuredCard}>
                <EditorialVisual label={featured.coverLabel} tone="ink" height={196} />
                <View style={styles.featuredBody}>
                  <Text style={styles.featuredMeta}>{featured.category} · {featured.readMinutes} {t("journal.minRead")}</Text>
                  <Text style={styles.featuredTitle}>{featured.title}</Text>
                  <Text style={styles.featuredSubtitle}>{featured.subtitle}</Text>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Card variant="tinted" style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t("journal.emptyTitle")}</Text>
              <Text style={styles.emptyCopy}>{t("journal.emptyCopy")}</Text>
            </Card>
          )}

          <View style={styles.articleList}>
            {rest.map((article, index) => (
              <Pressable key={article.id} onPress={() => router.push(`/journal/${article.slug}` as never)}>
                <Card variant="default" style={styles.articleCard}>
                  <View style={styles.articleLeading}>
                    <Text style={styles.articleIndex}>{String(index + 2).padStart(2, "0")}</Text>
                  </View>
                  <View style={styles.articleContent}>
                    <Text style={styles.articleMeta}>{article.category} · {article.readMinutes} {t("journal.min")}</Text>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleExcerpt} numberOfLines={2}>{article.excerpt}</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
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
      paddingBottom: SPACING.section,
      gap: 16,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 6,
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      color: colors.inkFaint,
      textTransform: "uppercase",
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 36,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.inkMid,
    },
    filterRow: {
      marginTop: 4,
    },
    filterScroll: {
      paddingHorizontal: 20,
      gap: 8,
    },
    searchWrap: {
      paddingHorizontal: 20,
      marginTop: 6,
    },
    featuredWrap: {
      marginTop: 2,
    },
    featuredCard: {
      padding: 10,
      gap: 12,
    },
    featuredBody: {
      gap: 4,
      paddingHorizontal: 4,
      paddingBottom: 4,
    },
    featuredMeta: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.1,
      color: colors.accent,
      textTransform: "uppercase",
    },
    featuredTitle: {
      fontFamily: FONTS.serif,
      fontSize: 29,
      lineHeight: 33,
      color: colors.ink,
    },
    featuredSubtitle: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.inkMid,
    },
    section: {
      paddingHorizontal: 20,
      marginTop: 10,
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    sectionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
    },
    sectionMeta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkFaint,
    },
    articleList: {
      gap: 10,
    },
    articleCard: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    articleLeading: {
      width: 30,
      alignItems: "center",
      justifyContent: "center",
    },
    articleIndex: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      color: colors.inkFaint,
    },
    articleContent: {
      flex: 1,
      gap: 3,
    },
    articleMeta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      letterSpacing: 0.7,
      color: colors.accent,
      textTransform: "uppercase",
    },
    articleTitle: {
      fontFamily: FONTS.serif,
      fontSize: 22,
      lineHeight: 26,
      color: colors.ink,
    },
    articleExcerpt: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    emptyCard: {
      gap: 6,
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 17,
      color: colors.ink,
    },
    emptyCopy: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
  });
