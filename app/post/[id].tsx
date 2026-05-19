import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StackHeader } from "@/components/ui/StackHeader";
import { addPostComment, getCommunityPostById, listPostComments, subscribeToPostThread, type CommunityComment, type CommunityPost } from "@/services/community";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";

function formatRelative(isoDate: string, language: "tr" | "en") {
  const diffMs = Date.now() - +new Date(isoDate);
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return language === "tr" ? `${minutes} dk` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === "tr" ? `${hours} sa` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return language === "tr" ? `${days} gün` : `${days} d`;
}

export default function PostDetailScreen() {
  const { id, focusComment } = useLocalSearchParams<{ id: string; focusComment?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { language } = useI18n();
  const profile = useUserStore((state) => state.profile);

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savedPostIds = useSocialPrefsStore((s) => s.savedPostIds);
  const archivedPostIds = useSocialPrefsStore((s) => s.archivedPostIds);
  const toggleSavedPost = useSocialPrefsStore((s) => s.toggleSavedPost);
  const toggleArchivedPost = useSocialPrefsStore((s) => s.toggleArchivedPost);
  const inputRef = useRef<TextInput>(null);

  const copy = language === "tr"
    ? {
      title: "Gönderi",
      subtitle: "Topluluk",
      placeholder: "Yorum yaz...",
      replyTo: "Yanıtla",
      send: "Gönder",
      cancelReply: "Yanıtı iptal et",
      empty: "Henüz yorum yok, ilk yorumu sen yaz.",
      notFound: "Gönderi bulunamadı",
      save: "Kaydet",
      saved: "Kaydedildi",
      archive: "Arşivle",
      archived: "Arşivde",
      writeComment: "Yorum yap",
      addFailed: "Yorum gönderilemedi. Tekrar deneyebilirsin.",
      quickReply1: "Katılıyorum, çok dengeli duruyor.",
      quickReply2: "Performans notunu da merak ettim 👀",
      quickReply3: "Bunu hangi mevsimde daha çok seviyorsun?",
    }
    : {
      title: "Post",
      subtitle: "Community",
      placeholder: "Write a comment...",
      replyTo: "Reply",
      send: "Send",
      cancelReply: "Cancel reply",
      empty: "No comments yet. Be the first one.",
      notFound: "Post not found",
      save: "Save",
      saved: "Saved",
      archive: "Archive",
      archived: "Archived",
      writeComment: "Write comment",
      addFailed: "Could not send your comment. Please try again.",
      quickReply1: "Agreed, this sounds very balanced.",
      quickReply2: "Curious about the performance too 👀",
      quickReply3: "Which season do you enjoy this most?",
    };
  const quickReplies = [copy.quickReply1, copy.quickReply2, copy.quickReply3];
  const isSaved = !!post && savedPostIds.includes(post.id);
  const isArchived = !!post && archivedPostIds.includes(post.id);

  const load = useCallback(async () => {
    if (!id) return;
    const [postData, commentData] = await Promise.all([getCommunityPostById(id), listPostComments(id)]);
    setPost(postData);
    setComments(commentData);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToPostThread(id, () => {
      void load();
    });
    return unsubscribe;
  }, [id, load]);

  useEffect(() => {
    if (focusComment !== "1") return;
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(timeout);
  }, [focusComment]);

  const commentsByParent = useMemo(() => {
    const roots = comments.filter((item) => !item.parentId);
    const replies = new Map<string, CommunityComment[]>();
    comments.filter((item) => !!item.parentId).forEach((item) => {
      const key = item.parentId as string;
      const list = replies.get(key) ?? [];
      list.push(item);
      replies.set(key, list);
    });
    return { roots, replies };
  }, [comments]);

  const submitComment = async () => {
    if (!id || input.trim().length < 2 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addPostComment({
        postId: id,
        body: input,
        parentId: replyTo?.id,
        authorName: profile?.fullName ?? profile?.username ?? (language === "tr" ? "Sen" : "You"),
      });
      triggerHaptic("success").catch(() => undefined);
      setInput("");
      setReplyTo(null);
      await load();
    } catch {
      Alert.alert(copy.addFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.root}>
        <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{copy.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card variant="default" style={styles.postCard}>
          <View style={styles.postHead}>
            <Text style={styles.postAuthor}>{post.authorName}</Text>
            <Text style={styles.postMeta}>{formatRelative(post.createdAt, language)}</Text>
          </View>
          <Text style={styles.postCaption}>{post.caption}</Text>
          {post.mediaUrl ? (
            <View style={styles.mediaWrap}>
              <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} />
            </View>
          ) : null}
          {post.perfumeName ? (
            <Pressable style={styles.perfumePill} onPress={() => router.push(`/perfume/${post.perfumeId}` as never)}>
              <Text style={styles.perfumePillText}>{post.perfumeBrand} · {post.perfumeName}</Text>
            </Pressable>
          ) : null}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionPill}
              onPress={() => {
                triggerHaptic("selection").catch(() => undefined);
                toggleSavedPost(post.id);
              }}
            >
              <Text style={styles.actionPillText}>{isSaved ? copy.saved : copy.save}</Text>
            </Pressable>
            <Pressable
              style={styles.actionPill}
              onPress={() => {
                triggerHaptic("selection").catch(() => undefined);
                toggleArchivedPost(post.id);
              }}
            >
              <Text style={styles.actionPillText}>{isArchived ? copy.archived : copy.archive}</Text>
            </Pressable>
            <Pressable style={styles.actionPill} onPress={() => inputRef.current?.focus()}>
              <Text style={styles.actionPillText}>{copy.writeComment}</Text>
            </Pressable>
          </View>
        </Card>

        <View style={styles.commentsSection}>
          {commentsByParent.roots.length === 0 ? (
            <Text style={styles.emptyText}>{copy.empty}</Text>
          ) : (
            commentsByParent.roots.map((comment) => (
              <View key={comment.id} style={styles.commentWrap}>
                <Card variant="flat" style={styles.commentCard}>
                  <View style={styles.commentHead}>
                    <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                    <Text style={styles.commentMeta}>{formatRelative(comment.createdAt, language)}</Text>
                  </View>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic("selection").catch(() => undefined);
                      setReplyTo(comment);
                    }}
                  >
                    <Text style={styles.replyAction}>{copy.replyTo}</Text>
                  </Pressable>
                </Card>

                {(commentsByParent.replies.get(comment.id) ?? []).map((reply) => (
                  <View key={reply.id} style={styles.replyRow}>
                    <Card variant="default" style={styles.replyCard}>
                      <View style={styles.commentHead}>
                        <Text style={styles.commentAuthor}>{reply.authorName}</Text>
                        <Text style={styles.commentMeta}>{formatRelative(reply.createdAt, language)}</Text>
                      </View>
                      <Text style={styles.commentBody}>{reply.body}</Text>
                    </Card>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        {replyTo ? (
          <View style={styles.replyingRow}>
            <Text style={styles.replyingText}>@{replyTo.authorName}</Text>
            <Pressable onPress={() => setReplyTo(null)}>
              <Text style={styles.cancelReply}>{copy.cancelReply}</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />
          <Button
            title={copy.send}
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={input.trim().length < 2 || isSubmitting}
            onPress={() => void submitComment()}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesRow}>
          {quickReplies.map((quickReply) => (
            <Pressable
              key={quickReply}
              style={styles.quickReplyPill}
              onPress={() => {
                setInput(quickReply);
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.quickReplyText}>{quickReply}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
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
      paddingBottom: 180,
      gap: SPACING.md,
    },
    postCard: {
      gap: SPACING.sm,
    },
    postHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    postAuthor: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    postMeta: {
      fontFamily: FONTS.sans,
      fontSize: 11,
      color: colors.inkFaint,
    },
    postCaption: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink,
    },
    mediaWrap: {
      borderRadius: RADIUS.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surfaceAlt,
    },
    postMedia: {
      width: "100%",
      aspectRatio: 4 / 3,
      resizeMode: "cover",
    },
    perfumePill: {
      alignSelf: "flex-start",
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    perfumePillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    actionPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    actionPillText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    commentsSection: {
      gap: SPACING.sm,
    },
    commentWrap: {
      gap: 8,
    },
    commentCard: {
      gap: 6,
    },
    commentHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    commentAuthor: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.ink,
    },
    commentMeta: {
      fontFamily: FONTS.sans,
      fontSize: 11,
      color: colors.inkFaint,
    },
    commentBody: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMid,
    },
    replyAction: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    replyRow: {
      paddingLeft: 16,
    },
    replyCard: {
      gap: 6,
    },
    inputBar: {
      position: "absolute",
      left: 10,
      right: 10,
      bottom: 8,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      gap: 6,
    },
    replyingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    replyingText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 12,
      color: colors.accent,
    },
    cancelReply: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    input: {
      flex: 1,
      minHeight: 42,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.ink,
    },
    quickRepliesRow: {
      gap: 8,
      paddingTop: 2,
    },
    quickReplyPill: {
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    quickReplyText: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkMid,
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
