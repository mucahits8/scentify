import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useUserStore } from "@/stores/useUserStore";
import { FAMILY_GRADIENTS, FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import type { CollectionItem } from "@/utils/types";

type ProfileTab = "collection" | "wishlist" | "following";

// Perfume grid thumbnail
function PerfumeThumbnail({ item, size, onPress }: { item: CollectionItem; size: number; onPress: () => void }) {
  const { isDark } = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const family = item.perfume.families?.[0];
  const [g0, g1] = (family ? FAMILY_GRADIENTS[family] : undefined) ?? FAMILY_GRADIENTS.Default;

  return (
    <Pressable
      style={{ width: size, height: size, borderRadius: RADIUS.md, overflow: "hidden" }}
      onPress={onPress}
    >
      <LinearGradient colors={[g0, g1]} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      {item.perfume.imageUrl && !imgFailed ? (
        <Image
          source={{ uri: item.perfume.imageUrl }}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "90%" }}
          resizeMode="contain"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      <LinearGradient
        colors={["transparent", "rgba(16,12,9,0.6)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" }}
      />
      <Text
        style={{
          position: "absolute",
          bottom: 6,
          left: 6,
          right: 4,
          fontFamily: FONTS.sansSemiBold,
          fontSize: 10,
          color: "#FFF8F1",
          lineHeight: 13,
        }}
        numberOfLines={2}
      >
        {item.perfume.name}
      </Text>
    </Pressable>
  );
}

// Stat column — pressable
function StatColumn({ value, label, onPress }: { value: number | string; label: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable style={{ alignItems: "center", flex: 1, gap: 2 }} onPress={onPress}>
      <Text style={{ fontFamily: FONTS.sansBold, fontSize: 20, color: colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 11, color: colors.inkMid }}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const profile = useUserStore((state) => state.profile);
  const scentDNA = useUserStore((state) => state.scentDNA);
  const items = useCollectionStore((state) => state.items);
  const getByStatus = useCollectionStore((state) => state.getByStatus);

  const [activeTab, setActiveTab] = useState<ProfileTab>("collection");

  const ownedItems = getByStatus("owned");
  const wishlistItems = getByStatus("wishlist");
  const sampledItems = getByStatus("sampled");

  // 3-column grid
  const GAP = 2;
  const COLS = 3;
  const thumbSize = (width - SPACING.xxl * 2 - GAP * (COLS - 1)) / COLS;

  const displayName = profile?.fullName ?? t("profile.userFallback");
  const initial = displayName.charAt(0).toUpperCase();
  const dnaLabel = scentDNA?.bestFamilies?.[0] ?? t("profile.dnaFallback");
  const dnaFamilies = scentDNA?.bestFamilies?.slice(0, 3) ?? [];

  const tabItems =
    activeTab === "collection" ? items :
    activeTab === "wishlist" ? wishlistItems : [];

  const TAB_DEFS: { key: ProfileTab; label: string }[] = [
    { key: "collection", label: "Koleksiyonum" },
    { key: "wishlist", label: "İstek Listesi" },
    { key: "following", label: "Takip" },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{displayName}</Text>
        <View style={styles.topBarActions}>
          <Pressable
            style={styles.gearButton}
            onPress={() => router.push("/(main)/journal" as never)}
          >
            <TabBarIcon name="journal" color={colors.inkMid} size={18} />
          </Pressable>
          <Pressable
            style={styles.gearButton}
            onPress={() => router.push("/settings" as never)}
          >
            <TabBarIcon name="chevron-right" color={colors.inkMid} size={16} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={isDark ? ["#8B6040", "#5A3820"] : ["#D4A87A", "#A87049"]}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitial}>{initial}</Text>
            </LinearGradient>
          </View>

          {/* Name + DNA */}
          <Text style={styles.displayName}>{displayName}</Text>
          {dnaFamilies.length > 0 && (
            <View style={styles.dnaRow}>
              {dnaFamilies.map((f) => (
                <View key={f} style={styles.dnaBadge}>
                  <Text style={styles.dnaBadgeText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bio placeholder */}
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>Koku tutkunun profili</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatColumn
            value={items.length}
            label="Parfümlerim"
            onPress={() => setActiveTab("collection")}
          />
          <View style={styles.statDivider} />
          <StatColumn
            value={wishlistItems.length}
            label="Alacaklarım"
            onPress={() => setActiveTab("wishlist")}
          />
          <View style={styles.statDivider} />
          <StatColumn value={0} label="Takip" onPress={() => setActiveTab("following")} />
          <View style={styles.statDivider} />
          <StatColumn value={0} label="Takipçi" />
        </View>

        <View style={styles.quickActionRow}>
          <Pressable style={styles.quickActionCard} onPress={() => router.push("/settings" as never)}>
            <View style={styles.quickIconWrap}>
              <TabBarIcon name="profile" color={colors.accent} size={14} />
            </View>
            <Text style={styles.quickActionText}>{t("profile.edit")}</Text>
          </Pressable>
          <Pressable style={styles.quickActionCard} onPress={() => router.push("/(main)/collection" as never)}>
            <View style={styles.quickIconWrap}>
              <TabBarIcon name="collection" color={colors.accent} size={14} />
            </View>
            <Text style={styles.quickActionText}>{t("tabs.collection")}</Text>
          </Pressable>
          <Pressable style={styles.quickActionCard} onPress={() => router.push("/create-post" as never)}>
            <View style={styles.quickIconWrap}>
              <TabBarIcon name="sparkle" color={colors.accent} size={14} />
            </View>
            <Text style={styles.quickActionText}>{language === "tr" ? "Paylaşım" : "Post"}</Text>
          </Pressable>
        </View>

        <View style={styles.profileMetricsRow}>
          <View style={styles.profileMetricCard}>
            <Text style={styles.profileMetricLabel}>{language === "tr" ? "Sahip" : "Owned"}</Text>
            <Text style={styles.profileMetricValue}>{ownedItems.length}</Text>
          </View>
          <View style={styles.profileMetricCard}>
            <Text style={styles.profileMetricLabel}>Wishlist</Text>
            <Text style={styles.profileMetricValue}>{wishlistItems.length}</Text>
          </View>
          <View style={styles.profileMetricCard}>
            <Text style={styles.profileMetricLabel}>{language === "tr" ? "Denendi" : "Sampled"}</Text>
            <Text style={styles.profileMetricValue}>{sampledItems.length}</Text>
          </View>
        </View>

        {/* DNA summary card */}
        <Pressable
          style={styles.dnaCard}
          onPress={() => router.push("/dna/detail" as never)}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.dnaCardEyebrow}>SCENT DNA</Text>
            <Text style={styles.dnaCardTitle}>{dnaLabel}</Text>
            {scentDNA?.summary ? (
              <Text style={styles.dnaCardBody} numberOfLines={2}>{scentDNA.summary}</Text>
            ) : null}
          </View>
          <View style={styles.dnaCardArrow}>
            <Text style={{ fontSize: 18, color: colors.accent }}>›</Text>
          </View>
        </Pressable>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TAB_DEFS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {activeTab === "following" ? (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonTitle}>Yakında</Text>
              <Text style={styles.comingSoonBody}>
                Takip ettiğin koku tutkunlarının koleksiyonlarını burada göreceksin.
              </Text>
            </View>
          ) : tabItems.length === 0 ? (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonTitle}>Henüz yok</Text>
              <Text style={styles.comingSoonBody}>
                {activeTab === "wishlist"
                  ? "Almak istediğin parfümleri koleksiyonuna ekle."
                  : "Koleksiyonun boş. Parfüm keşfetmeye başla."}
              </Text>
              <Pressable
                style={styles.exploreBtn}
                onPress={() => router.push("/(main)/discover" as never)}
              >
                <Text style={styles.exploreBtnText}>Keşfet</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.gridInner}>
              {tabItems.map((item) => (
                <PerfumeThumbnail
                  key={item.id}
                  item={item}
                  size={thumbSize}
                  onPress={() => router.push(`/perfume/${item.perfume.id}` as never)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topBarTitle: {
      fontFamily: FONTS.sansBold,
      fontSize: 16,
      color: colors.ink,
    },
    topBarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    gearButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionRow: {
      marginTop: SPACING.md,
      marginHorizontal: SPACING.xxl,
      flexDirection: "row",
      gap: SPACING.sm,
    },
    quickActionCard: {
      flex: 1,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      gap: 4,
    },
    quickIconWrap: {
      width: 26,
      height: 26,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.accentMid,
      backgroundColor: colors.accentLight,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.ink,
    },
    profileMetricsRow: {
      marginTop: SPACING.sm,
      marginHorizontal: SPACING.xxl,
      flexDirection: "row",
      gap: SPACING.sm,
    },
    profileMetricCard: {
      flex: 1,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
      gap: 2,
    },
    profileMetricLabel: {
      fontFamily: FONTS.sans,
      fontSize: 10,
      color: colors.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    profileMetricValue: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 16,
      color: colors.ink,
    },
    profileHeader: {
      alignItems: "center",
      paddingTop: SPACING.xxl,
      paddingHorizontal: SPACING.xxl,
      paddingBottom: SPACING.lg,
      gap: SPACING.sm,
    },
    avatarWrap: {
      marginBottom: SPACING.sm,
      ...SHADOWS.lift,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontFamily: FONTS.sansBold,
      fontSize: 36,
      color: "#FFF8F1",
    },
    displayName: {
      fontFamily: FONTS.serif,
      fontSize: 24,
      color: colors.ink,
      textAlign: "center",
    },
    dnaRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    dnaBadge: {
      backgroundColor: colors.accentLight,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.accentMid,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: 3,
    },
    dnaBadgeText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.accent,
    },
    bio: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
      textAlign: "center",
      lineHeight: 19,
    },
    bioPlaceholder: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkFaint,
      textAlign: "center",
      fontStyle: "italic",
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginHorizontal: SPACING.xxl,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      ...SHADOWS.soft,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: colors.border,
    },
    dnaCard: {
      marginHorizontal: SPACING.xxl,
      marginTop: SPACING.lg,
      backgroundColor: colors.surfaceTinted,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.accentMid,
      padding: SPACING.lg,
      flexDirection: "row",
      alignItems: "center",
    },
    dnaCardEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 9,
      letterSpacing: 2.5,
      color: colors.accent,
    },
    dnaCardTitle: {
      fontFamily: FONTS.serif,
      fontSize: 20,
      color: colors.ink,
    },
    dnaCardBody: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
      lineHeight: 17,
    },
    dnaCardArrow: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      marginTop: SPACING.lg,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.md,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.accent,
    },
    tabLabel: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: colors.inkFaint,
    },
    tabLabelActive: {
      color: colors.ink,
      fontFamily: FONTS.sansSemiBold,
    },
    grid: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxxl,
    },
    gridInner: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
    },
    comingSoon: {
      alignItems: "center",
      paddingVertical: SPACING.xxxl * 2,
      gap: SPACING.md,
    },
    comingSoonTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 17,
      color: colors.ink,
    },
    comingSoonBody: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
      lineHeight: 21,
    },
    exploreBtn: {
      marginTop: SPACING.sm,
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
    },
    exploreBtnText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: "#FFF8F1",
    },
  });
