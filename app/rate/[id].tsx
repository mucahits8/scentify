import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { StackHeader } from "@/components/ui/StackHeader";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { FONTS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function RatePerfumeScreen() {
  const router = useRouter();
  const { language } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const setRating = useCollectionStore((state) => state.setRating);
  const [rating, setLocalRating] = useState(4);
  const copy = language === "tr"
    ? {
      headerTitle: "Parfümü Puanla",
      headerSub: "Değerlendirme",
      title: "Bu kokuyu puanla",
      body: "Hızlı bir puan ver; profiline ve koleksiyon akışına işlensin.",
      save: "Puanı Kaydet",
      back: "Parfüme Dön",
      savedTitle: "Kaydedildi",
      savedBody: "Puan kaydedildi.",
      ok: "Tamam",
    }
    : {
      headerTitle: "Rate Perfume",
      headerSub: "Review",
      title: "Rate this scent",
      body: "Give a quick rating so it improves profile and collection recommendations.",
      save: "Save Rating",
      back: "Back to Perfume",
      savedTitle: "Saved",
      savedBody: "Rating saved.",
      ok: "OK",
    };

  function safeBack() {
    const maybeCanGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    if (typeof maybeCanGoBack === "function" && maybeCanGoBack()) {
      router.back();
      return;
    }
    router.replace("/collection" as never);
  }

  async function handleSave() {
    if (!id) return;
    await setRating(id, rating);
    Alert.alert(copy.savedTitle, copy.savedBody, [{ text: copy.ok, onPress: safeBack }]);
  }

  return (
    <Screen style={styles.screen}>
      <StackHeader title={copy.headerTitle} subtitle={copy.headerSub} />
      <Card variant="default" style={styles.content}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.copy}>{copy.body}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} onPress={() => setLocalRating(value)} style={styles.starButton} hitSlop={8}>
              <Text style={[styles.star, value <= rating && styles.starFilled]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 1 ? (language === "tr" ? "Beğenmedim" : "Not for me")
           : rating === 2 ? (language === "tr" ? "İdare eder" : "It's okay")
           : rating === 3 ? (language === "tr" ? "İyi" : "Good")
           : rating === 4 ? (language === "tr" ? "Çok iyi" : "Really good")
           : (language === "tr" ? "Mükemmel" : "Outstanding")}
        </Text>
        <Button title={copy.save} variant="copper" onPress={() => void handleSave()} />
        <Button title={copy.back} variant="ghost" onPress={safeBack} />
      </Card>
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    screen: {
      gap: 24,
    },
    content: {
      gap: 14,
      paddingTop: SPACING.md,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 28,
      color: colors.ink,
    },
    copy: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 22,
      color: colors.inkMid,
    },
    starsRow: {
      flexDirection: "row",
      gap: 4,
    },
    starButton: {
      padding: 4,
    },
    star: {
      fontSize: 40,
      color: colors.borderLight,
    },
    starFilled: {
      color: colors.accent,
    },
    ratingLabel: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      letterSpacing: 0.4,
      color: colors.inkMid,
      textAlign: "center",
    },
  });
