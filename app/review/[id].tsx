import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { StackHeader } from "@/components/ui/StackHeader";
import { createPerfumeReview } from "@/services/reviews";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function WriteReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useUserStore((state) => state.profile);
  const setRating = useCollectionStore((state) => state.setRating);
  const [rating, setRatingValue] = useState(4);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const copy = language === "tr"
    ? {
      title: "Yorum Yaz",
      subtitle: "Topluluk",
      body: "Deneyimini kısa ve net yaz. Profiline ve keşif akışına etki etsin.",
      placeholder: "Bu koku sende nasıl açıldı, nasıl kapandı?",
      save: "Yorumu Kaydet",
      cancel: "Geri",
      required: "Yorumun en az 8 karakter olsun.",
      failed: "Yorum şu anda kaydedilemedi. Lütfen tekrar dene.",
      ok: "Tamam",
      saved: "Yorum kaydedildi",
      savedBody: "Puanın ve yorumun profile işlendi.",
    }
    : {
      title: "Write Review",
      subtitle: "Community",
      body: "Share a concise experience. This helps your profile and discovery quality.",
      placeholder: "How did this scent open and dry down on you?",
      save: "Save Review",
      cancel: "Back",
      required: "Comment should be at least 8 characters.",
      failed: "Could not save review right now. Please try again.",
      ok: "OK",
      saved: "Review saved",
      savedBody: "Your rating and comment were recorded.",
    };

  async function handleSave() {
    if (!id || comment.trim().length < 8) {
      Alert.alert(copy.required);
      return;
    }

    setSaving(true);
    try {
      await setRating(id, rating);
      await createPerfumeReview({
        perfumeId: id,
        rating,
        comment,
        authorId: profile?.id,
        authorName: profile?.fullName ?? profile?.username ?? (language === "tr" ? "Sen" : "You"),
      });
      Alert.alert(copy.saved, copy.savedBody, [{ text: copy.ok, onPress: () => router.back() }]);
    } catch {
      Alert.alert(copy.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen style={styles.screen}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <Card variant="default" style={styles.card}>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} onPress={() => setRatingValue(value)} style={styles.starButton} hitSlop={8}>
              <Text style={[styles.star, value <= rating && styles.starFilled]}>★</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          placeholder={copy.placeholder}
          placeholderTextColor={colors.inkFaint}
          style={styles.textarea}
          textAlignVertical="top"
        />
        <Button title={saving ? "..." : copy.save} variant="copper" onPress={() => void handleSave()} />
        <Button title={copy.cancel} variant="ghost" onPress={() => router.back()} />
      </Card>
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
    body: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
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
      fontSize: 38,
      color: colors.borderLight,
    },
    starFilled: {
      color: colors.accent,
    },
    textarea: {
      minHeight: 120,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.ink,
      lineHeight: 20,
    },
  });
