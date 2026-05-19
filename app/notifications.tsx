import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StackHeader } from "@/components/ui/StackHeader";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { listNotifications, markAllNotificationsRead, markNotificationRead, subscribeNotifications, type AppNotification, type NotificationKind } from "@/services/notifications";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

type NotificationFilter = "all" | NotificationKind;

function formatRelative(isoDate: string, language: "tr" | "en") {
  const diffMs = Date.now() - +new Date(isoDate);
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return language === "tr" ? `${minutes} dk` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === "tr" ? `${hours} sa` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return language === "tr" ? `${days} gün` : `${days} d`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const copy = language === "tr"
    ? {
      title: "Bildirimler",
      subtitle: "Inbox",
      markAll: "Tümünü Oku",
      all: "Tümü",
      social: "Sosyal",
      reminder: "Hatırlatmalar",
      wishlist: "Wishlist",
      unread: "Okunmamış",
      read: "Okundu",
      emptyTitle: "Bildirim yok",
      emptyBody: "Yeni etkileşimler burada görünecek.",
      routeErrorTitle: "Gönderi açılamadı",
      routeErrorBody: "Bu içerik artık erişilebilir değil.",
    }
    : {
      title: "Notifications",
      subtitle: "Inbox",
      markAll: "Mark all read",
      all: "All",
      social: "Social",
      reminder: "Reminders",
      wishlist: "Wishlist",
      unread: "Unread",
      read: "Read",
      emptyTitle: "No notifications",
      emptyBody: "New activity will appear here.",
      routeErrorTitle: "Unable to open",
      routeErrorBody: "This content is no longer available.",
    };

  const load = useCallback(async () => {
    const items = await listNotifications();
    setNotifications(items);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeNotifications(() => {
      void load();
    });
    return unsubscribe;
  }, [load]);

  const visible = notifications.filter((item) => activeFilter === "all" || item.type === activeFilter);
  const unread = visible.filter((item) => !item.readAt);
  const read = visible.filter((item) => !!item.readAt);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openNotification = async (item: AppNotification) => {
    const next = await markNotificationRead(item.id);
    setNotifications(next);

    if (!item.target.exists) {
      Alert.alert(copy.routeErrorTitle, copy.routeErrorBody);
      return;
    }

    router.push(item.target.route as never);
  };

  const markAll = async () => {
    const next = await markAllNotificationsRead();
    setNotifications(next);
  };

  const filters: Array<{ key: NotificationFilter; label: string }> = [
    { key: "all", label: copy.all },
    { key: "social", label: copy.social },
    { key: "reminder", label: copy.reminder },
    { key: "wishlist", label: copy.wishlist },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} rightLabel={copy.markAll} onRightPress={() => void markAll()} />

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRowContent}>
          {filters.map((filter) => {
            const active = filter.key === activeFilter;
            return (
              <Pressable key={filter.key} style={[styles.filterPill, active && styles.filterPillActive]} onPress={() => setActiveFilter(filter.key)}>
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {loading ? (
          <Text style={styles.sectionTitle}>...</Text>
        ) : visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
            <Text style={styles.emptyBody}>{copy.emptyBody}</Text>
          </View>
        ) : (
          <>
            {unread.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.unread}</Text>
                {unread.map((item) => (
                  <NotificationRow key={item.id} item={item} onPress={() => void openNotification(item)} language={language} />
                ))}
              </View>
            ) : null}
            {read.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.read}</Text>
                {read.map((item) => (
                  <NotificationRow key={item.id} item={item} onPress={() => void openNotification(item)} language={language} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationRow({
  item,
  onPress,
  language,
}: {
  item: AppNotification;
  onPress: () => void;
  language: "tr" | "en";
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconName = item.type === "social" ? "heart" : item.type === "wishlist" ? "bookmark" : "sparkle";
  const toneStyle = item.readAt ? styles.cardRead : styles.cardUnread;

  return (
    <Pressable style={[styles.card, toneStyle]} onPress={onPress}>
      <View style={styles.leading}>
        <TabBarIcon name={iconName} color={colors.accent} size={15} />
      </View>
      <View style={styles.copyWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.meta}>{formatRelative(item.createdAt, language)}</Text>
        </View>
        <Text style={styles.cardBody}>{item.body}</Text>
      </View>
      {!item.readAt ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    filterRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: SPACING.sm,
    },
    filterRowContent: {
      paddingHorizontal: SPACING.xxl,
      gap: SPACING.sm,
    },
    filterPill: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    filterPillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.inkMid,
    },
    filterPillTextActive: {
      color: "#FFF8F1",
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.xl,
      gap: SPACING.lg,
      flexGrow: 1,
    },
    section: { gap: SPACING.sm },
    sectionTitle: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: colors.inkFaint,
      marginBottom: 4,
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    cardUnread: {
      backgroundColor: colors.surface,
      borderColor: colors.borderLight,
    },
    cardRead: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      opacity: 0.86,
    },
    leading: {
      width: 30,
      height: 30,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      marginTop: 1,
    },
    copyWrap: {
      flex: 1,
      gap: 4,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.md,
      alignItems: "baseline",
    },
    cardTitle: {
      flex: 1,
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    cardBody: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 18,
      color: colors.inkMid,
    },
    meta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.inkFaint,
      textTransform: "uppercase",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginTop: 8,
    },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: SPACING.xxxl,
      gap: SPACING.sm,
    },
    emptyTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
    },
    emptyBody: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
    },
  });
