import { useMemo } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StackHeader } from "@/components/ui/StackHeader";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language } = useI18n();
  const blockedUsers = useSocialPrefsStore((s) => s.blockedUsers);
  const unblockUser = useSocialPrefsStore((s) => s.unblockUser);

  const copy =
    language === "tr"
      ? {
          title: "Engellenen Kullanıcılar",
          subtitle: "Gizlilik",
          empty: "Şu an engellenen kullanıcı yok.",
          unblock: "Engeli kaldır",
          confirmTitle: "Engel kaldırılsın mı?",
          confirmBody: "Bu kullanıcı tekrar sana erişebilir.",
          cancel: "Vazgeç",
          confirm: "Kaldır",
        }
      : {
          title: "Blocked Users",
          subtitle: "Privacy",
          empty: "No blocked users right now.",
          unblock: "Unblock",
          confirmTitle: "Unblock user?",
          confirmBody: "This user will be able to interact with you again.",
          cancel: "Cancel",
          confirm: "Unblock",
        };

  const handleUnblock = (userId: string) => {
    Alert.alert(copy.confirmTitle, copy.confirmBody, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.confirm, style: "destructive", onPress: () => unblockUser(userId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <View style={styles.content}>
        {blockedUsers.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{copy.empty}</Text>
          </View>
        ) : (
          blockedUsers.map((user) => (
            <View key={user.id} style={styles.row}>
              <View style={{ gap: 2 }}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.handle}>{user.handle}</Text>
              </View>
              <Pressable style={styles.unblockButton} onPress={() => handleUnblock(user.id)}>
                <Text style={styles.unblockText}>{copy.unblock}</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.md,
      gap: SPACING.sm,
      flex: 1,
    },
    row: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    name: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    handle: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
    },
    unblockButton: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: 7,
    },
    unblockText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.error,
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      color: colors.inkMid,
      textAlign: "center",
    },
  });
