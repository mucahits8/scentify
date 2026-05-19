import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/utils/i18n";
import { FONTS, ONBOARDING_STEPS, RADIUS, SPACING } from "@/utils/constants";

interface OnboardingShellProps {
  step: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  canContinue?: boolean;
  onContinue: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  stepLabel?: string;
  continueLabel?: string;
}

function onboardingFocus(step: number, language: "tr" | "en") {
  const tr = [
    "Başlangıç yönünü seçiyoruz; ilk öneri evreni buna göre açılıyor.",
    "Sevdiğin şişeler DNA omurganı kuruyor.",
    "Net eleme tercihleri, önerileri daha keskin yapıyor.",
    "Sahip oldukların, tekrar öneriyi azaltıp keşfi genişletiyor.",
    "Stil ve kaçınmalar, karakter tonunu netleştiriyor.",
    "Kullanım senaryosu ve yoğunluk, doğru anı hedefliyor.",
    "Bütçe filtresi, önerileri satın alma gerçekliğine yaklaştırıyor.",
    "Hava durumu sinyali, günlük seçimleri dinamikleştiriyor.",
    "Son adım: profili aktive edip keşfe geçiyoruz.",
  ];
  const en = [
    "We set your entry direction so the first recommendation universe is on target.",
    "Your loved bottles become the backbone of your DNA.",
    "Clear dislikes make recommendations sharper.",
    "What you own reduces repeats and expands discovery.",
    "Style and skip notes define your profile character.",
    "Usage context and intensity help us hit the right moments.",
    "Budget framing keeps recommendations buyable in real life.",
    "Weather signal makes daily picks adaptive.",
    "Final step: activate your profile and enter discovery.",
  ];

  const source = language === "tr" ? tr : en;
  return source[Math.max(0, Math.min(source.length - 1, step - 1))];
}

export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
  canContinue = true,
  onContinue,
  showSkip,
  onSkip,
  stepLabel,
  continueLabel,
}: OnboardingShellProps) {
  const router = useRouter();
  const { t, language } = useI18n();
  const motion = useMotionProfile();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const total = ONBOARDING_STEPS.length;
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const progressValue = useRef(new Animated.Value(0)).current;
  const introValue = useRef(new Animated.Value(0)).current;
  const nextProgress = Math.max(0, Math.min(1, step / Math.max(1, total)));
  const progressPercent = Math.round(nextProgress * 100);
  const focusBody = onboardingFocus(step, language);

  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: nextProgress,
      duration: Math.max(220, Math.round(360 * motion.durationScale)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [motion.durationScale, nextProgress, progressValue]);

  useEffect(() => {
    introValue.setValue(0);
    Animated.timing(introValue, {
      toValue: 1,
      duration: Math.max(240, Math.round(420 * motion.durationScale)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [introValue, motion.durationScale, step]);

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressTrackWidth],
    extrapolate: "clamp",
  });
  const focusMotion = {
    opacity: introValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: introValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const copyMotion = {
    opacity: introValue.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 0, 1],
    }),
    transform: [
      {
        translateY: introValue.interpolate({
          inputRange: [0, 1],
          outputRange: [16 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const bodyMotion = {
    opacity: introValue.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 0, 1],
    }),
    transform: [
      {
        translateY: introValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20 * motion.distanceScale, 0],
        }),
      },
    ],
  };
  const footerMotion = {
    opacity: introValue.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0, 0, 1],
    }),
    transform: [
      {
        translateY: introValue.interpolate({
          inputRange: [0, 1],
          outputRange: [14 * motion.distanceScale, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.introPanel}>
            <LinearGradient
              colors={isDark ? ["#1A1612", "#37261B"] : ["#1A1410", "#6E4933"]}
              style={styles.introGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.headerRow}>
              <Text style={styles.stepCounter}>{String(step).padStart(2, "0")}</Text>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepLabel}>
                  {stepLabel ?? `Step ${String(step).padStart(2, "0")} · ${ONBOARDING_STEPS[step - 1]}`}
                </Text>
                <Text style={styles.progressMeta}>
                  {language === "tr" ? `%${progressPercent} tamamlandı` : `${progressPercent}% completed`}
                </Text>
              </View>
              {showSkip ? (
                <Pressable onPress={onSkip} hitSlop={10}>
                  <Text style={styles.skipText}>{t("common.skip")}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.progressTrack} onLayout={(event) => setProgressTrackWidth(event.nativeEvent.layout.width)}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            <View style={styles.stepDots}>
              {ONBOARDING_STEPS.map((_, index) => {
                const isDone = index + 1 <= step;
                return <View key={`dot-${index + 1}`} style={[styles.stepDot, isDone && styles.stepDotActive]} />;
              })}
            </View>
          </View>

          <Animated.View style={[styles.focusCard, focusMotion]}>
            <Text style={styles.focusBody}>{focusBody}</Text>
          </Animated.View>

          <Animated.View style={[styles.copy, copyMotion]}>
            {typeof title === "string" ? <Text style={styles.title}>{title}</Text> : title}
            {subtitle ? (
              typeof subtitle === "string" ? <Text style={styles.subtitle}>{subtitle}</Text> : subtitle
            ) : null}
          </Animated.View>

          <Animated.View style={[styles.body, bodyMotion]}>{children}</Animated.View>
        </ScrollView>

        <LinearGradient
          colors={[`${colors.bg}00`, `${colors.bg}E0`, colors.bg]}
          style={styles.footerGradient}
          pointerEvents="none"
        />
        <Animated.View style={[styles.footer, footerMotion]}>
          <Button title={t("common.back")} variant="ghost" onPress={() => router.back()} style={styles.backButton} />
          <Button
            title={continueLabel ?? t("common.continue")}
            variant="copper"
            onPress={onContinue}
            disabled={!canContinue}
            style={styles.continueButton}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 144,
      gap: 18,
    },
    introPanel: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,248,241,0.12)" : "rgba(26,20,16,0.10)",
      backgroundColor: colors.heroSurface,
      padding: SPACING.lg,
      gap: 14,
      overflow: "hidden",
    },
    introGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 1,
    },
    progressTrack: {
      width: "100%",
      height: 7,
      borderRadius: RADIUS.full,
      backgroundColor: "rgba(255,248,241,0.18)",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#F0C08F",
      borderRadius: RADIUS.full,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    stepTextWrap: {
      flex: 1,
      gap: 3,
    },
    stepCounter: {
      fontFamily: FONTS.serif,
      fontSize: 44,
      lineHeight: 46,
      color: "#FFF8F1",
    },
    stepLabel: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: "rgba(255,248,241,0.72)",
    },
    progressMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: "rgba(255,248,241,0.62)",
    },
    focusCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      paddingVertical: 2,
      paddingHorizontal: 12,
    },
    focusBody: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      lineHeight: 20,
      color: colors.inkMid,
    },
    stepDots: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
    },
    stepDot: {
      flex: 1,
      height: 4,
      borderRadius: RADIUS.full,
      backgroundColor: "rgba(255,248,241,0.18)",
    },
    stepDotActive: {
      backgroundColor: "#F0C08F",
    },
    skipText: {
      fontFamily: FONTS.sansMedium,
      fontSize: 13,
      color: "#FFF8F1",
    },
    copy: {
      gap: 9,
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 36,
      lineHeight: 38,
      letterSpacing: -0.8,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: FONTS.sans,
      fontSize: 14,
      lineHeight: 21,
      color: colors.inkMid,
    },
    body: {
      gap: 20,
    },
    footerGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120,
    },
    footer: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 20,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.glass,
    },
    backButton: {
      flexBasis: 94,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.glass : colors.glass,
    },
    continueButton: {
      flex: 1,
    },
  });
