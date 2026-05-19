import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EditorialVisual } from "@/components/ui/EditorialVisual";
import { StackHeader } from "@/components/ui/StackHeader";
import { editorialArticles, getEditorialArticleBySlug } from "@/services/editorial";
import { FONTS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function JournalDetailScreen() {
  const router = useRouter();
  const { language } = useI18n();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const article = slug ? getEditorialArticleBySlug(slug) : null;
  const related = article
    ? editorialArticles.filter((item) => item.id !== article.id).slice(0, 3)
    : [];
  const copy = language === "tr"
    ? {
      journal: "Dergi",
      article: "Yazı",
      notFound: "Yazı bulunamadı",
      notFoundCopy: "Bu içerik taşınmış olabilir. Dergiye dönüp başka bir yazı seçebilirsin.",
      returnJournal: "Dergiye Dön",
      minRead: "dk okuma",
      by: "Yazar",
      quickTakeaways: "Hızlı çıkarımlar",
      relatedReads: "Benzer okumalar",
      seeAll: "Tümünü gör",
      min: "dk",
    }
    : {
      journal: "Journal",
      article: "Article",
      notFound: "Article not found",
      notFoundCopy: "This story may have moved. Go back to Journal to pick another read.",
      returnJournal: "Return to Journal",
      minRead: "min read",
      by: "By",
      quickTakeaways: "Quick takeaways",
      relatedReads: "Related reads",
      seeAll: "See all",
      min: "min",
    };

  function safeBack() {
    const maybeCanGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    if (typeof maybeCanGoBack === "function" && maybeCanGoBack()) {
      router.back();
      return;
    }
    router.replace("/journal" as never);
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.safe}>
        <StackHeader title={copy.journal} subtitle={copy.article} onBack={safeBack} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{copy.notFound}</Text>
          <Text style={styles.emptyCopy}>{copy.notFoundCopy}</Text>
          <Pressable onPress={() => router.replace("/journal" as never)}>
            <Text style={styles.emptyAction}>{copy.returnJournal}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <StackHeader title={copy.journal} subtitle={article.category} onBack={safeBack} />

        <View style={styles.hero}>
          <EditorialVisual label={article.coverLabel} tone="ink" height={220} />
          <View style={styles.heroCopy}>
            <Text style={styles.meta}>{article.category} · {article.readMinutes} {copy.minRead} · {article.publishedAt}</Text>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.subtitle}>{article.subtitle}</Text>
            <Text style={styles.author}>{copy.by} {article.author}</Text>
            <View style={styles.tagsWrap}>
              {article.tags.map((tag) => (
                <Chip key={tag} label={tag} selected tone="accent" size="sm" />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {article.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.heading}</Text>
              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph.slice(0, 24)} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.takeawayWrap}>
          <Card variant="tinted" style={styles.takeawayCard}>
            <Text style={styles.takeawayEyebrow}>{copy.quickTakeaways}</Text>
            {article.takeaway.map((item, index) => (
              <View key={item} style={styles.takeawayRow}>
                <Text style={styles.takeawayIndex}>{String(index + 1).padStart(2, "0")}</Text>
                <Text style={styles.takeawayText}>{item}</Text>
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.relatedWrap}>
          <View style={styles.relatedHeader}>
            <Text style={styles.relatedTitle}>{copy.relatedReads}</Text>
            <Pressable onPress={() => router.replace("/journal" as never)}>
              <Text style={styles.relatedAction}>{copy.seeAll}</Text>
            </Pressable>
          </View>
          <View style={styles.relatedList}>
            {related.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/journal/${item.slug}` as never)}>
                <Card variant="default" style={styles.relatedCard}>
                  <Text style={styles.relatedMeta}>{item.category} · {item.readMinutes} {copy.min}</Text>
                  <Text style={styles.relatedCardTitle}>{item.title}</Text>
                  <Text style={styles.relatedExcerpt} numberOfLines={2}>{item.excerpt}</Text>
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
      gap: 20,
    },
    hero: {
      paddingHorizontal: 20,
      gap: 14,
    },
    heroCopy: {
      gap: 6,
    },
    meta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.inkFaint,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 38,
      lineHeight: 42,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 22,
      color: colors.inkMid,
    },
    author: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkFaint,
      marginTop: 2,
    },
    tagsWrap: {
      marginTop: 8,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    content: {
      paddingHorizontal: 20,
      gap: 18,
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
    },
    paragraph: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 24,
      color: colors.inkMid,
    },
    takeawayWrap: {
      paddingHorizontal: 20,
    },
    takeawayCard: {
      gap: 10,
      paddingVertical: 18,
    },
    takeawayEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
    },
    takeawayRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    takeawayIndex: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      color: colors.accent,
      paddingTop: 2,
    },
    takeawayText: {
      flex: 1,
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.ink,
    },
    emptyState: {
      paddingHorizontal: 24,
      paddingTop: 80,
      gap: 8,
      alignItems: "center",
    },
    emptyTitle: {
      fontFamily: FONTS.serif,
      fontSize: 28,
      color: colors.ink,
      textAlign: "center",
    },
    emptyCopy: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.inkMid,
      textAlign: "center",
    },
    emptyAction: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.accent,
      marginTop: 8,
    },
    relatedWrap: {
      paddingHorizontal: 20,
      marginTop: 4,
      gap: 10,
    },
    relatedHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    relatedTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
    },
    relatedAction: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.accent,
    },
    relatedList: {
      gap: 10,
    },
    relatedCard: {
      gap: 4,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    relatedMeta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.accent,
    },
    relatedCardTitle: {
      fontFamily: FONTS.serif,
      fontSize: 23,
      lineHeight: 27,
      color: colors.ink,
    },
    relatedExcerpt: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
  });
