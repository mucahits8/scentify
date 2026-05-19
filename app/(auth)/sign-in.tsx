import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

const DEMO_EMAIL = "demo@scentify.app";
const DEMO_PASSWORD = "scentify123";

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
          setDemoSession();
          router.replace("/");
          return;
        }
        throw new Error(`Use demo credentials: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signIn.errorFallback"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t("auth.signIn.eyebrow")}</Text>
            <Text style={styles.title}>{t("auth.signIn.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.signIn.subtitle")}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.signIn.emailPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.signIn.passwordPlaceholder")}
              secureTextEntry
              autoComplete="current-password"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={t("auth.signIn.submit")}
              variant="primary"
              loading={loading}
              onPress={handleSignIn}
            />
          </View>

          {/* Demo credentials card */}
          <View style={styles.demoCard}>
            <Text style={styles.demoLabel}>{t("auth.signIn.demoLabel")}</Text>
            <View style={styles.demoRow}>
              <Text style={styles.demoKey}>{t("auth.signIn.demoEmail")}</Text>
              <Text style={styles.demoValue}>{DEMO_EMAIL}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoKey}>{t("auth.signIn.demoPassword")}</Text>
              <Text style={styles.demoValue}>{DEMO_PASSWORD}</Text>
            </View>
          </View>

          {/* Sign up link */}
          <Pressable onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={styles.signUpLink}>
              {t("auth.signIn.signUp")}
              <Text style={styles.signUpLinkAccent}>{t("auth.signIn.signUpAccent")}</Text>
            </Text>
          </Pressable>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xxxl,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 18,
    color: colors.ink,
    lineHeight: 22,
  },
  header: {
    gap: SPACING.sm,
  },
  eyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.accent,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 36,
    lineHeight: 42,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMid,
  },
  form: {
    gap: SPACING.lg,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: colors.error,
    lineHeight: 18,
  },
  demoCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  demoLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.inkFaint,
    marginBottom: SPACING.xs,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  demoKey: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: colors.inkMid,
    width: 64,
  },
  demoValue: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 0.2,
  },
  signUpLink: {
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: colors.inkMid,
    textAlign: "center",
  },
  signUpLinkAccent: {
    color: colors.accent,
  },
});
