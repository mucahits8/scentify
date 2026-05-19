import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { triggerHaptic } from "@/utils/haptics";
import { useI18n } from "@/utils/i18n";

type QuickAction = {
  id:
    | "post_fotd"
    | "post_review"
    | "post_question"
    | "post_layering"
    | "post_comparison"
    | "post_worth_it"
    | "scan"
    | "discover"
    | "journal";
  title: string;
  subtitle: string;
  icon: "sparkle" | "discover" | "collection" | "journal";
  to: string;
};

export default function CreateSheetScreen() {
  const router = useRouter();
  const motion = useMotionProfile();
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerAnim = useRef(new Animated.Value(motion.isReducedMotion ? 1 : 0)).current;
  const cardAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(motion.isReducedMotion ? 1 : 0)),
  ).current;

  const actions: QuickAction[] = [
    {
      id: "post_fotd",
      title: language === "tr" ? "FOTD Paylaş" : "Share FOTD",
      subtitle: language === "tr" ? "Günün kokusunu hızlıca paylaş." : "Share your fragrance of the day.",
      icon: "sparkle",
      to: "/create-post?type=fotd",
    },
    {
      id: "post_review",
      title: language === "tr" ? "İnceleme Yaz" : "Write Review",
      subtitle: language === "tr" ? "Parfüm hakkında detaylı yorum bırak." : "Post a detailed perfume review.",
      icon: "sparkle",
      to: "/create-post?type=review",
    },
    {
      id: "post_question",
      title: language === "tr" ? "Soru Sor" : "Ask Community",
      subtitle: language === "tr" ? "Topluluktan tavsiye veya görüş al." : "Ask for opinions and recommendations.",
      icon: "sparkle",
      to: "/create-post?type=question",
    },
    {
      id: "post_layering",
      title: language === "tr" ? "Katmanlama Paylaş" : "Share Layering",
      subtitle: language === "tr" ? "İki parfümlü katman kombinini yaz." : "Share your two-scent layering combo.",
      icon: "sparkle",
      to: "/create-post?type=layering",
    },
    {
      id: "post_comparison",
      title: language === "tr" ? "Karşılaştırma Aç" : "Open Comparison",
      subtitle: language === "tr" ? "İki parfüm arasında topluluk görüşü al." : "Ask community to compare two perfumes.",
      icon: "sparkle",
      to: "/create-post?type=comparison",
    },
    {
      id: "post_worth_it",
      title: language === "tr" ? "Alınır mı? Sor" : "Ask Worth It?",
      subtitle: language === "tr" ? "Fiyat/şişe durumuyla alım tavsiyesi iste." : "Ask buying advice with price and condition context.",
      icon: "sparkle",
      to: "/create-post?type=worth_it",
    },
    {
      id: "scan",
      title: t("createSheet.scanTitle"),
      subtitle: t("createSheet.scanSubtitle"),
      icon: "discover",
      to: "/(scan)/capture",
    },
    {
      id: "discover",
      title: t("createSheet.discoverTitle"),
      subtitle: t("createSheet.discoverSubtitle"),
      icon: "collection",
      to: "/(main)/discover",
    },
    {
      id: "journal",
      title: t("createSheet.journalTitle"),
      subtitle: t("createSheet.journalSubtitle"),
      icon: "journal",
      to: "/(main)/journal",
    },
  ];

  useEffect(() => {
    if (motion.isReducedMotion) return;

    headerAnim.setValue(0);
    cardAnims.forEach((value) => value.setValue(0));

    const baseDuration = Math.max(180, Math.round(280 * motion.durationScale));
    const cardDuration = Math.max(160, Math.round(260 * motion.durationScale));
    const staggerDelay = Math.max(30, Math.round(70 * motion.durationScale));

    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: baseDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        staggerDelay,
        cardAnims.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: cardDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [cardAnims, headerAnim, motion.distanceScale, motion.durationScale, motion.isReducedMotion]);

  useEffect(() => {
    triggerHaptic("selection").catch(() => undefined);
  }, []);

  const handleClose = () => {
    triggerHaptic("selection").catch(() => undefined);
    router.back();
  };

  const handleActionPress = (to: string) => {
    triggerHaptic("impact").catch(() => undefined);
    router.replace(to as never);
  };

  const headerAnimatedStyle = motion.isReducedMotion
    ? undefined
    : {
        opacity: headerAnim,
        transform: [
          {
            translateY: headerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [14 * motion.distanceScale, 0],
            }),
          },
        ],
      };

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View>
          <Text style={styles.eyebrow}>{t("createSheet.eyebrow")}</Text>
          <Text style={styles.title}>{t("createSheet.title")}</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {actions.map((action, index) => {
          const animValue = cardAnims[index] ?? headerAnim;
          const cardAnimatedStyle = motion.isReducedMotion
            ? undefined
            : {
                opacity: animValue,
                transform: [
                  {
                    translateY: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16 * motion.distanceScale, 0],
                    }),
                  },
                ],
              };

          return (
            <Animated.View key={action.id} style={cardAnimatedStyle}>
              <Pressable onPress={() => handleActionPress(action.to)}>
                <Card variant="default" style={styles.actionCard}>
                  <View style={styles.actionIcon}>
                    <TabBarIcon name={action.icon} color={colors.accent} />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xl,
      gap: SPACING.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.accent,
      marginBottom: 4,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 32,
      color: colors.ink,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    closeButtonText: {
      fontFamily: FONTS.sansBold,
      fontSize: 14,
      color: colors.ink,
    },
    content: {
      flex: 1,
    },
    contentInner: {
      gap: SPACING.md,
      paddingBottom: SPACING.md,
    },
    actionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.lg,
    },
    actionIcon: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
    },
    actionTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 15,
      color: colors.ink,
    },
    actionSubtitle: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
      lineHeight: 19,
    },
    arrow: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 22,
      color: colors.inkFaint,
      marginTop: -2,
    },
  });
