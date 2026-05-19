import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StackHeader } from "@/components/ui/StackHeader";
import { listCommunityPosts, type CommunityPost } from "@/services/community";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function ArchivedPostsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language } = useI18n();
  const archivedPostIds = useSocialPrefsStore((s) => s.archivedPostIds);
  const removeArchivedPost = useSocialPrefsStore((s) => s.removeArchivedPost);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const copy =
    language === "tr"
      ? {
          title: "Arşivlenen Gönderiler",
          subtitle: "Sosyal",
          empty: "Henüz arşivlenen gönderi yok.",
          unarchive: "Arşivden çıkar",
        }
      : {
          title: "Archived Posts",
          subtitle: "Social",
          empty: "You have no archived posts yet.",
          unarchive: "Unarchive",
        };

  const load = useCallback(async () => {
    const allPosts = await listCommunityPosts(120);
    setPosts(allPosts.filter((post) => archivedPostIds.includes(post.id)));
  }, [archivedPostIds]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {loading ? (
          <Text style={styles.meta}>...</Text>
        ) : posts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{copy.empty}</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.row}>
              <Pressable onPress={() => router.push(`/post/${post.id}` as never)} style={{ flex: 1, gap: 4 }}>
                <Text style={styles.meta}>{post.authorName} · {post.type.toUpperCase()}</Text>
                <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>
              </Pressable>
              <Pressable style={styles.removeBtn} onPress={() => removeArchivedPost(post.id)}>
                <Text style={styles.removeText}>{copy.unarchive}</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.sm,
      flexGrow: 1,
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
      gap: SPACING.sm,
    },
    meta: {
      fontFamily: FONTS.sansMedium,
      fontSize: 11,
      color: colors.inkFaint,
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },
    caption: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 18,
      color: colors.ink,
    },
    removeBtn: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: 7,
    },
    removeText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
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
