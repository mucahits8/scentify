import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { DNABarChart } from "@/components/dna/DNABarChart";
import { RadarChart } from "@/components/dna/RadarChart";
import { StackHeader } from "@/components/ui/StackHeader";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function DNADetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scentDNA = useUserStore((state) => state.scentDNA);

  if (!scentDNA) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const topFamily = scentDNA.bestFamilies?.[0] ?? t("profile.dnaFallback");
  const allFamilies = scentDNA.bestFamilies ?? [];
  const profileTags = scentDNA.profileTags ?? [];
  const avoidNotes = scentDNA.avoidNotes ?? [];

  return (
    <SafeAreaView style={styles.root}>
      <StackHeader title="Scent DNA" subtitle="Profil" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t("profile.yourScentDNA")}</Text>
          <Text style={styles.title}>{topFamily}</Text>
          {scentDNA.summary ? (
            <Text style={styles.summary}>{scentDNA.summary}</Text>
          ) : null}
        </View>

        {/* Radar chart */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DNA RADAR</Text>
          <RadarChart profile={scentDNA} />
        </View>

        {/* Bar chart */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SCENT DIMENSIONS</Text>
          <DNABarChart profile={scentDNA} />
        </View>

        {/* Best families */}
        {allFamilies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Families</Text>
            <View style={styles.chipRow}>
              {allFamilies.map((family) => (
                <View key={family} style={styles.chip}>
                  <Text style={styles.chipText}>{family}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Profile tags */}
        {profileTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Tags</Text>
            <View style={styles.chipRow}>
              {profileTags.map((tag) => (
                <View key={tag} style={[styles.chip, styles.chipAccent]}>
                  <Text style={[styles.chipText, styles.chipTextAccent]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Avoid notes */}
        {avoidNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes to Avoid</Text>
            <View style={styles.chipRow}>
              {avoidNotes.map((note) => (
                <View key={note} style={[styles.chip, styles.chipMuted]}>
                  <Text style={[styles.chipText, styles.chipTextMuted]}>{note}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.xxxl,
    },
    header: {
      gap: SPACING.sm,
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
      fontSize: 36,
      lineHeight: 42,
      color: colors.ink,
    },
    summary: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 23,
      color: colors.inkMid,
    },
    card: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      gap: SPACING.lg,
    },
    cardLabel: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      color: colors.inkFaint,
    },
    section: {
      gap: SPACING.md,
    },
    sectionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 15,
      color: colors.ink,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkMid,
    },
    chipAccent: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipTextAccent: {
      color: "#FFFFFF",
    },
    chipMuted: {
      backgroundColor: colors.errorBg,
      borderColor: colors.error,
    },
    chipTextMuted: {
      color: colors.error,
    },
  });
