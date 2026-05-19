import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StackHeader } from "@/components/ui/StackHeader";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";
import type { CollectionStatus } from "@/utils/types";

const STATUSES: CollectionStatus[] = ["owned", "wishlist", "sampled", "want_to_try"];

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, language } = useI18n();

  const items = useCollectionStore((state) => state.items);
  const addItem = useCollectionStore((state) => state.addItem);
  const item = items.find((entry) => entry.perfume.id === id);

  const copy = language === "tr"
    ? {
      title: "Koleksiyon Detayı",
      subtitle: "Parfüm",
      notFound: "Bu ürün koleksiyonda görünmüyor.",
      status: "Durum",
      metadata: "Kişisel Bilgiler",
      actions: "Hızlı Aksiyonlar",
      purchaseDate: "Satın alma",
      rating: "Puan",
      notes: "Not",
      empty: "Henüz yok",
      createPost: "Bu ürünle gönderi oluştur",
      rate: "Puanla",
      addCollection: "Koleksiyona ekle/güncelle",
      statusLabel: {
        owned: "Sahip",
        wishlist: "Wishlist",
        sampled: "Denedim",
        want_to_try: "Denemek istiyorum",
      } as Record<CollectionStatus, string>,
    }
    : {
      title: "Collection Detail",
      subtitle: "Perfume",
      notFound: "This item is not in your collection.",
      status: "Status",
      metadata: "Personal Metadata",
      actions: "Quick Actions",
      purchaseDate: "Purchase date",
      rating: "Rating",
      notes: "Note",
      empty: "Not set",
      createPost: "Create post with this perfume",
      rate: "Rate",
      addCollection: "Update collection status",
      statusLabel: {
        owned: "Owned",
        wishlist: "Wishlist",
        sampled: "Sampled",
        want_to_try: "Want to try",
      } as Record<CollectionStatus, string>,
    };

  if (!item) {
    return (
      <View style={styles.root}>
        <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{copy.notFound}</Text>
        </View>
      </View>
    );
  }

  const changeStatus = async (status: CollectionStatus) => {
    await addItem(item.perfume.id, status);
    triggerHaptic("success").catch(() => undefined);
  };

  const deleteFromCollection = () => {
    Alert.alert(
      language === "tr" ? "Kaldır" : "Remove",
      language === "tr"
        ? "Bu ürünü koleksiyondan kaldırmak istediğine emin misin?"
        : "Are you sure you want to remove this item from collection?",
      [
        { text: language === "tr" ? "Vazgeç" : "Cancel", style: "cancel" },
        {
          text: language === "tr" ? "Kaldır" : "Remove",
          style: "destructive",
          onPress: async () => {
            await addItem(item.perfume.id, "want_to_try");
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StackHeader title={copy.title} subtitle={item.perfume.name} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card variant="default" style={styles.heroCard}>
          <Text style={styles.heroBrand}>{item.perfume.brand}</Text>
          <Text style={styles.heroName}>{item.perfume.name}</Text>
          <Text style={styles.heroMeta}>{item.perfume.concentration ?? "EDP"} · {item.perfume.year ?? "—"}</Text>
        </Card>

        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.status}</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((status) => {
              const active = status === item.status;
              return (
                <Pressable
                  key={status}
                  style={[styles.statusPill, active && styles.statusPillActive]}
                  onPress={() => {
                    triggerHaptic("selection").catch(() => undefined);
                    void changeStatus(status);
                  }}
                >
                  <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>{copy.statusLabel[status]}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.metadata}</Text>
          <MetaRow label={copy.purchaseDate} value={item.purchaseDate ?? copy.empty} />
          <MetaRow label={copy.rating} value={item.rating ? `${item.rating}/5` : copy.empty} />
          <MetaRow label={copy.notes} value={item.notes ?? copy.empty} />
        </Card>

        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.actions}</Text>
          <Button
            title={copy.createPost}
            variant="primary"
            onPress={() =>
              router.push(
                {
                  pathname: "/create-post",
                  params: {
                    perfumeId: item.perfume.id,
                    type: "review",
                  },
                } as never,
              )
            }
          />
          <Button title={copy.rate} variant="secondary" onPress={() => router.push(`/rate/${item.perfume.id}` as never)} />
          <Button title={copy.addCollection} variant="ghost" onPress={() => router.push(`/add-to-collection/${item.perfume.id}` as never)} />
          <Pressable style={styles.deleteAction} onPress={deleteFromCollection}>
            <Text style={styles.deleteActionText}>{language === "tr" ? "Koleksiyondan kaldır" : "Remove from collection"}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
      <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: colors.inkMid }}>{label}</Text>
      <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: colors.ink, flexShrink: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingHorizontal: SPACING.xxl,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.md,
    },
    heroCard: {
      gap: 4,
    },
    heroBrand: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.accent,
    },
    heroName: {
      fontFamily: FONTS.serif,
      fontSize: 28,
      color: colors.ink,
      lineHeight: 34,
    },
    heroMeta: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
    },
    sectionCard: {
      gap: SPACING.sm,
    },
    sectionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    statusRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    statusPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    statusPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    statusPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    statusPillTextActive: {
      color: "#FFF8F1",
    },
    deleteAction: {
      alignSelf: "center",
      paddingTop: 4,
    },
    deleteActionText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.error,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xxl,
    },
    emptyText: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
    },
  });
