import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { StackHeader } from "@/components/ui/StackHeader";
import { getPublicProfileById, type ReviewAuthor } from "@/services/reviews";
import { FONTS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [author, setAuthor] = useState<ReviewAuthor | null>(null);
  const [loading, setLoading] = useState(false);

  const copy = language === "tr"
    ? {
      title: "Profil",
      subtitle: "Topluluk Üyesi",
      missing: "Profil bulunamadı",
      missingBody: "Bu kullanıcıya ait görünür profil bilgisi şu an mevcut değil.",
      back: "Geri",
      recentTaste: "Son koku eğilimi",
    }
    : {
      title: "Profile",
      subtitle: "Community Member",
      missing: "Profile not found",
      missingBody: "No public profile information is available for this member right now.",
      back: "Back",
      recentTaste: "Recent scent taste",
    };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPublicProfileById(id)
      .then((profile) => {
        setAuthor(profile);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <Screen style={styles.screen}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      {loading ? (
        <Card variant="default" style={styles.card}>
          <ActivityIndicator size="small" color={colors.accent} />
        </Card>
      ) : null}
      {!loading && !author ? (
        <Card variant="default" style={styles.card}>
          <Text style={styles.name}>{copy.missing}</Text>
          <Text style={styles.meta}>{copy.missingBody}</Text>
          <Button title={copy.back} variant="ghost" onPress={() => router.back()} />
        </Card>
      ) : null}
      {!loading && author ? (
        <Card variant="default" style={styles.card}>
          <Text style={styles.name}>{author.name}</Text>
          <Text style={styles.meta}>{author.headline ?? copy.subtitle}</Text>
          {author.bio ? <Text style={styles.meta}>{author.bio}</Text> : null}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>{copy.recentTaste}</Text>
          <Text style={styles.meta}>{author.headline ?? "Fresh, woody, and balanced signatures."}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    screen: {
      gap: SPACING.lg,
    },
    card: {
      gap: SPACING.md,
    },
    name: {
      fontFamily: FONTS.serif,
      fontSize: 30,
      color: colors.ink,
    },
    meta: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      lineHeight: 21,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
    },
    sectionTitle: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: colors.accent,
    },
  });
