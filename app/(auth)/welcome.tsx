import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn, signUp } from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

type AuthMode = "signIn" | "signUp";

const DEMO_EMAIL = "demo@scentify.app";
const DEMO_PASSWORD = "scentify123";

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeError(message: string | undefined, language: "tr" | "en") {
  const raw = (message ?? "").toLowerCase();
  if (raw.includes("invalid login credentials")) {
    return language === "tr" ? "E-posta veya şifre hatalı." : "Email or password is incorrect.";
  }
  if (raw.includes("already registered") || raw.includes("already exists")) {
    return language === "tr" ? "Bu e-posta ile zaten bir hesap var." : "An account already exists for this email.";
  }
  if (raw.includes("network") || raw.includes("timeout") || raw.includes("failed to fetch")) {
    return language === "tr" ? "Ağ bağlantısı kurulamadı. Lütfen tekrar dene." : "Network connection failed. Please try again.";
  }
  return language === "tr" ? "İşlem şu anda tamamlanamadı." : "We could not complete this action right now.";
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useI18n();
  const styles = createStyles(colors);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = isEmailValid(email);
  const passwordValid = password.trim().length >= 6;
  const fullNameValid = fullName.trim().length >= 2;
  const canSubmit = mode === "signIn" ? emailValid && passwordValid : emailValid && passwordValid && fullNameValid;

  const copy = language === "tr"
    ? {
      eyebrow: "Koku Yolculuğu",
      title: "Scentify",
      subtitle: "Kokuları ezberlemek yerine zevkini öğrenen kişisel keşif alanın.",
      signIn: "Giriş Yap",
      signUp: "Hesap Oluştur",
      fullName: "Ad Soyad",
      email: "E-posta",
      password: "Şifre",
      ctaSignIn: "Devam Et",
      ctaSignUp: "Hesabımı Oluştur",
      guest: "Misafir olarak dene",
      guestHint: "Önce kısa onboarding, sonra uygulamanın içi.",
      promiseA: "DNA profili",
      promiseB: "Akıllı öneriler",
      promiseC: "Koleksiyon",
      helperSignIn: `Demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
      helperSignUp: "Şifre en az 6 karakter olmalı.",
      emailInvalid: "Geçerli bir e-posta gir.",
      passwordInvalid: "Şifre en az 6 karakter olmalı.",
      fullNameInvalid: "Ad Soyad en az 2 karakter olmalı.",
      verifyNotice: "Hesap oluşturuldu. E-postanı doğrulayıp giriş yapabilirsin.",
    }
    : {
      eyebrow: "Fragrance Journey",
      title: "Scentify",
      subtitle: "A personal discovery space that learns your taste instead of making you memorize notes.",
      signIn: "Sign In",
      signUp: "Sign Up",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      ctaSignIn: "Continue",
      ctaSignUp: "Create Account",
      guest: "Try as guest",
      guestHint: "Start with onboarding, then enter the app.",
      promiseA: "DNA profile",
      promiseB: "Smart picks",
      promiseC: "Collection",
      helperSignIn: `Demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
      helperSignUp: "Password should be at least 6 characters.",
      emailInvalid: "Enter a valid email address.",
      passwordInvalid: "Password should be at least 6 characters.",
      fullNameInvalid: "Full name should be at least 2 characters.",
      verifyNotice: "Account created. Verify your email, then sign in.",
    };

  const helperText = useMemo(() => {
    if (submitError) return submitError;
    if (!emailValid && email.trim().length > 0) return copy.emailInvalid;
    if (!passwordValid && password.trim().length > 0) return copy.passwordInvalid;
    if (mode === "signUp" && !fullNameValid && fullName.trim().length > 0) return copy.fullNameInvalid;
    return mode === "signIn" ? copy.helperSignIn : copy.helperSignUp;
  }, [copy.emailInvalid, copy.fullNameInvalid, copy.helperSignIn, copy.helperSignUp, copy.passwordInvalid, email, emailValid, fullName, fullNameValid, mode, password, passwordValid, submitError]);

  const helperIsError = helperText === submitError || helperText === copy.emailInvalid || helperText === copy.passwordInvalid || helperText === copy.fullNameInvalid;

  const handleAuth = async () => {
    if (!canSubmit || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        if (mode === "signIn") {
          if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
            setDemoSession();
            router.replace("/");
            return;
          }
          throw new Error("invalid login credentials");
        }

        setDemoSession();
        router.replace("/");
        return;
      }

      if (mode === "signIn") {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        router.replace("/");
        return;
      }

      const { data, error } = await signUp(email.trim(), password, fullName.trim());
      if (error) throw error;

      if (!data.session) {
        setSubmitError(copy.verifyNotice);
        setMode("signIn");
        return;
      }

      router.replace("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      setSubmitError(normalizeError(message, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    setDemoSession();
    router.replace("/");
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setSubmitError(null);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.heroStage}>
            <LinearGradient
              colors={["#17120E", "#32231A", "#7F5438"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>

            <View style={styles.bottleScene} pointerEvents="none">
              <View style={styles.tallBottle}>
                <LinearGradient colors={["#F9E7C8", "#C68157", "#3B2218"]} style={StyleSheet.absoluteFill} />
              </View>
              <View style={styles.roundBottle}>
                <LinearGradient colors={["#FFF7E8", "#D9B06E", "#624232"]} style={StyleSheet.absoluteFill} />
              </View>
              <View style={styles.smallBottle}>
                <LinearGradient colors={["#E7F0E6", "#8CAB88", "#314C3C"]} style={StyleSheet.absoluteFill} />
              </View>
            </View>

            <View style={styles.promiseRow}>
              <Text style={styles.promiseText}>{copy.promiseA}</Text>
              <Text style={styles.promiseDot}>/</Text>
              <Text style={styles.promiseText}>{copy.promiseB}</Text>
              <Text style={styles.promiseDot}>/</Text>
              <Text style={styles.promiseText}>{copy.promiseC}</Text>
            </View>
          </View>

          <View style={styles.guestPanel}>
            <Button title={copy.guest} variant="copper" onPress={handleGuest} />
            <Text style={styles.guestHint}>{copy.guestHint}</Text>
          </View>

          <View style={styles.modeSwitch}>
            <Pressable style={[styles.modeButton, mode === "signIn" && styles.modeButtonActive]} onPress={() => switchMode("signIn")}>
              <Text style={[styles.modeButtonText, mode === "signIn" && styles.modeButtonTextActive]}>{copy.signIn}</Text>
            </Pressable>
            <Pressable style={[styles.modeButton, mode === "signUp" && styles.modeButtonActive]} onPress={() => switchMode("signUp")}>
              <Text style={[styles.modeButtonText, mode === "signUp" && styles.modeButtonTextActive]}>{copy.signUp}</Text>
            </Pressable>
          </View>

          <View style={styles.formPanel}>
            {mode === "signUp" ? (
              <Input value={fullName} onChangeText={setFullName} placeholder={copy.fullName} autoCapitalize="words" autoComplete="name" />
            ) : null}

            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={copy.email}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={copy.password}
              secureTextEntry
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            />

            <Text style={[styles.helperText, helperIsError && styles.helperTextError]}>{helperText}</Text>

            <Button
              title={mode === "signIn" ? copy.ctaSignIn : copy.ctaSignUp}
              variant="primary"
              loading={isSubmitting}
              disabled={!canSubmit}
              onPress={handleAuth}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.lg,
    },
    heroStage: {
      minHeight: 360,
      borderRadius: 28,
      overflow: "hidden",
      padding: SPACING.xl,
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: "rgba(255,248,241,0.16)",
    },
    heroContent: {
      maxWidth: 300,
      gap: SPACING.sm,
      zIndex: 2,
    },
    eyebrow: {
      fontFamily: FONTS.sansBold,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "#E9C49D",
    },
    title: {
      fontFamily: FONTS.serif,
      fontSize: 58,
      lineHeight: 60,
      color: "#FFF8F1",
    },
    subtitle: {
      fontFamily: FONTS.sans,
      fontSize: 15,
      lineHeight: 22,
      color: "rgba(255,248,241,0.78)",
    },
    bottleScene: {
      position: "absolute",
      right: 22,
      bottom: 58,
      width: 178,
      height: 190,
    },
    tallBottle: {
      position: "absolute",
      right: 42,
      bottom: 0,
      width: 72,
      height: 162,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,248,241,0.36)",
    },
    roundBottle: {
      position: "absolute",
      left: 0,
      bottom: 4,
      width: 92,
      height: 112,
      borderRadius: 34,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,248,241,0.32)",
    },
    smallBottle: {
      position: "absolute",
      right: 0,
      bottom: 8,
      width: 58,
      height: 92,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,248,241,0.28)",
    },
    promiseRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      zIndex: 2,
    },
    promiseText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 12,
      color: "#FFF8F1",
    },
    promiseDot: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: "rgba(255,248,241,0.45)",
    },
    guestPanel: {
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    guestHint: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkFaint,
      textAlign: "center",
    },
    modeSwitch: {
      flexDirection: "row",
      padding: 4,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      gap: 4,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.full,
      minHeight: 40,
    },
    modeButtonActive: {
      backgroundColor: colors.accent,
    },
    modeButtonText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.inkMid,
    },
    modeButtonTextActive: {
      color: "#FFF8F1",
    },
    formPanel: {
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: SPACING.md,
      gap: SPACING.md,
    },
    helperText: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkFaint,
      paddingHorizontal: 2,
    },
    helperTextError: {
      color: colors.error,
    },
  });
