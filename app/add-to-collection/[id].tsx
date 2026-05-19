import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { StackHeader } from "@/components/ui/StackHeader";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import type { CollectionStatus } from "@/utils/types";

export default function AddToCollectionScreen() {
  const router = useRouter();
  const { language } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const addItem = useCollectionStore((state) => state.addItem);
  const copy = language === "tr"
    ? {
      headerTitle: "Koleksiyona Ekle",
      headerSub: "Koleksiyon",
      title: "Bu parfümü rotasyonuna kaydet",
      body: "Bu parfümü koleksiyonunda hangi statüde tutacağını seç.",
      owned: "Sahip Olduğum",
      ownedDesc: "Şişe koleksiyonumda",
      wishlist: "İstek Listesi",
      wishlistDesc: "Sonra satın almak istiyorum",
      sampled: "Denedim",
      sampledDesc: "Test ettim veya dekant aldım",
      back: "Parfüme Dön",
      savedTitle: "Kaydedildi",
      savedBody: "Parfüm koleksiyonuna eklendi.",
      goCollection: "Koleksiyon",
      goBack: "Geri",
    }
    : {
      headerTitle: "Add to Collection",
      headerSub: "Collection",
      title: "Save this perfume to your rotation",
      body: "Choose which status this perfume should have in your collection.",
      owned: "Owned",
      ownedDesc: "Bottle in collection",
      wishlist: "Wishlist",
      wishlistDesc: "Want to buy later",
      sampled: "Sampled",
      sampledDesc: "Tested or decanted",
      back: "Back to Perfume",
      savedTitle: "Saved",
      savedBody: "Perfume added to collection.",
      goCollection: "Collection",
      goBack: "Back",
    };

  function safeBack() {
    const maybeCanGoBack = (router as unknown as { canGoBack?: () => boolean }).canGoBack;
    if (typeof maybeCanGoBack === "function" && maybeCanGoBack()) {
      router.back();
      return;
    }
    router.replace("/collection" as never);
  }

  async function handleSave(status: CollectionStatus) {
    if (!id) return;
    await addItem(id, status);
    Alert.alert(copy.savedTitle, copy.savedBody, [
      { text: copy.goCollection, onPress: () => router.replace("/collection" as never) },
      { text: copy.goBack, onPress: safeBack },
    ]);
  }

  return (
    <Screen style={styles.screen}>
      <StackHeader title={copy.headerTitle} subtitle={copy.headerSub} />
      <Card variant="default" style={styles.content}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.copy}>{copy.body}</Text>
        <View style={styles.options}>
          {[
            { key: "owned", label: copy.owned, copy: copy.ownedDesc },
            { key: "wishlist", label: copy.wishlist, copy: copy.wishlistDesc },
            { key: "sampled", label: copy.sampled, copy: copy.sampledDesc },
          ].map((option) => (
            <Pressable key={option.key} onPress={() => void handleSave(option.key as CollectionStatus)} style={styles.optionCard}>
              <Text style={styles.optionTitle}>{option.label}</Text>
              <Text style={styles.optionCopy}>{option.copy}</Text>
            </Pressable>
          ))}
        </View>
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
    options: {
      gap: 10,
    },
    optionCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      borderRadius: RADIUS.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 2,
    },
    optionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 16,
      color: colors.ink,
    },
    optionCopy: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
    },
  });
