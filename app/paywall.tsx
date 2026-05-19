import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StackHeader } from "@/components/ui/StackHeader";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";

const features = [
  "Unlimited perfume recommendations",
  "Projection & longevity insights",
  "Price drop and restock alerts",
  "Advanced layering suggestions",
  "Unlimited collection and notes",
  "Early access to new releases",
];

type PlanKey = "annual" | "monthly" | "weekly" | "free";

export default function PaywallScreen() {
  const router = useRouter();
  const motion = useMotionProfile();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const setPremium = useSubscriptionStore((state) => state.setPremium);
  const setPaywallShown = useSubscriptionStore((state) => state.setPaywallShown);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("annual");
  const sectionAnims = useRef([
    new Animated.Value(motion.isReducedMotion ? 1 : 0),
    new Animated.Value(motion.isReducedMotion ? 1 : 0),
    new Animated.Value(motion.isReducedMotion ? 1 : 0),
    new Animated.Value(motion.isReducedMotion ? 1 : 0),
  ]).current;

  const planMeta = useMemo(() => {
    if (selectedPlan === "annual") return "Then $29.99/year · Save 90%";
    if (selectedPlan === "monthly") return "Then $9.99/month · Flexible billing";
    if (selectedPlan === "weekly") return "Then $5.99/week · Cancel anytime";
    return "Continue with limited free experience";
  }, [selectedPlan]);

  const continueFree = () => {
    setPaywallShown(true);
    router.replace("/(main)");
  };

  const startTrial = () => {
    if (selectedPlan === "free") {
      continueFree();
      return;
    }
    setPremium(true);
    setPaywallShown(true);
    router.replace("/(main)");
  };

  useEffect(() => {
    if (motion.isReducedMotion) {
      sectionAnims.forEach((anim) => anim.setValue(1));
      return;
    }
    sectionAnims.forEach((anim) => anim.setValue(0));
    Animated.stagger(
      Math.max(50, Math.round(80 * motion.durationScale)),
      sectionAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: Math.max(220, Math.round(360 * motion.durationScale)),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [motion.durationScale, motion.isReducedMotion, sectionAnims]);

  const fadeInUp = (anim: Animated.Value, distance = 12) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance * motion.distanceScale, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StackHeader title="Scentify Pro" subtitle="Upgrade" rightLabel="Skip" onRightPress={continueFree} />
        <View style={styles.topRow}>
          <Pressable onPress={continueFree} hitSlop={12}>
            <Text style={styles.laterText}>Maybe later</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.hero, fadeInUp(sectionAnims[0] as Animated.Value, 14)]}>
          <LinearGradient
            colors={[colors.accentMid, "transparent"]}
            style={styles.heroGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroBadge}>
            <TabBarIcon name="sparkle" color={colors.accentForeground} size={26} focused />
          </View>
          <Text style={styles.heroTitle}>Scentify Pro</Text>
          <Text style={styles.heroSubtitle}>Unlock your full scent identity with smarter, richer perfume guidance.</Text>
        </Animated.View>

        <Animated.View style={[styles.plans, fadeInUp(sectionAnims[1] as Animated.Value, 12)]}>
          <Pressable onPress={() => setSelectedPlan("annual")}>
            <Card variant={selectedPlan === "annual" ? "dark" : "flat"} style={[styles.planCard, selectedPlan === "annual" && styles.planCardSelected]}>
              <View style={styles.planBadgeRow}>
                <Text style={[styles.planBadgeAccent, selectedPlan === "annual" && styles.planBadgeAccentOnDark]}>Annual</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Best Value</Text>
                </View>
              </View>
              <View style={styles.planRow}>
                <Text style={[styles.planTitleLight, selectedPlan === "annual" && styles.planTitleOnDark]}>$29.99 / year</Text>
                <Text style={[styles.planMetaLight, selectedPlan === "annual" && styles.planMetaOnDark]}>Save 90%</Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => setSelectedPlan("monthly")}>
            <Card variant="flat" style={[styles.planCard, selectedPlan === "monthly" && styles.planCardActive]}>
              <View style={styles.planRow}>
                <Text style={styles.planTitleLight}>Monthly</Text>
                <Text style={styles.planPriceLight}>$9.99 / month</Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => setSelectedPlan("weekly")}>
            <Card variant="flat" style={[styles.planCard, selectedPlan === "weekly" && styles.planCardActive]}>
              <View style={styles.planRow}>
                <Text style={styles.planTitleLight}>Weekly</Text>
                <Text style={styles.planPriceLight}>$5.99 / week</Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => setSelectedPlan("free")}>
            <Card variant="flat" style={[styles.planCard, selectedPlan === "free" && styles.planCardActive]}>
              <View style={styles.planRow}>
                <Text style={styles.planTitleLight}>Free Activation</Text>
                <Text style={styles.planPriceLight}>$0</Text>
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.featuresBlock, fadeInUp(sectionAnims[2] as Animated.Value, 10)]}>
          <Text style={styles.featuresEyebrow}>Everything included</Text>
          {features.map((feature, index) => (
            <View key={feature}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
              {index < features.length - 1 ? <View style={styles.featureDivider} /> : null}
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.cta, fadeInUp(sectionAnims[3] as Animated.Value, 8)]}>
          <Button
            title={selectedPlan === "free" ? "Continue Free" : "Start Free Trial"}
            variant="copper"
            onPress={startTrial}
          />
          <Text style={styles.ctaMeta}>{planMeta}</Text>
          <Button title="Restore Purchase" variant="ghost" onPress={() => undefined} />
          <Button title="Continue Free" variant="ghost" onPress={continueFree} />
        </Animated.View>
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
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xxl,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.xxxl,
    },
    topRow: {
      paddingTop: SPACING.lg,
      alignItems: "flex-end",
    },
    laterText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 14,
      color: colors.inkMid,
    },
    hero: {
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.lg,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
      paddingHorizontal: SPACING.md,
    },
    heroGlow: {
      position: "absolute",
      left: -20,
      top: -20,
      width: 220,
      height: 160,
      borderRadius: RADIUS.xxl,
      opacity: 0.8,
    },
    heroBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      ...SHADOWS.lift,
    },
    heroTitle: {
      fontFamily: FONTS.serif,
      fontSize: 34,
      color: colors.ink,
      textAlign: "center",
    },
    heroSubtitle: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 22,
      color: colors.inkMid,
      textAlign: "center",
    },
    plans: {
      gap: SPACING.md,
    },
    planCard: {
      gap: SPACING.sm,
      padding: SPACING.xl,
      ...SHADOWS.soft,
    },
    planCardSelected: {
      ...SHADOWS.lift,
    },
    planCardActive: {
      borderWidth: 1.5,
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    planBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    planBadgeAccent: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: colors.accent,
    },
    planBadgeAccentOnDark: {
      color: colors.accentForeground,
    },
    saveBadge: {
      backgroundColor: colors.successBg,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
    },
    saveBadgeText: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      color: colors.success,
    },
    planRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginTop: SPACING.xs,
    },
    planTitleLight: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 18,
      color: colors.ink,
    },
    planPriceLight: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 15,
      color: colors.ink,
      textAlign: "right",
    },
    planMetaLight: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: colors.inkMid,
    },
    planTitleOnDark: {
      color: colors.accentForeground,
    },
    planMetaOnDark: {
      color: "rgba(255,248,241,0.88)",
    },
    featuresBlock: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.lg,
      ...SHADOWS.soft,
    },
    featuresEyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: colors.inkFaint,
      marginBottom: SPACING.md,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.md,
    },
    featureCheck: {
      fontFamily: FONTS.sansBold,
      fontSize: 14,
      color: colors.accent,
      width: 18,
      textAlign: "center",
    },
    featureText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 14,
      color: colors.ink,
      flex: 1,
    },
    featureDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 30,
    },
    cta: {
      gap: SPACING.md,
    },
    ctaMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
      textAlign: "center",
    },
  });
