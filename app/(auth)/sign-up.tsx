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
import { signUp } from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const setDemoSession = useAuthStore((state) => state.setDemoSession);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        setDemoSession();
        router.replace("/");
        return;
      }

      const { data, error: signUpError } = await signUp(email, password, fullName);
      if (signUpError) throw signUpError;

      if (!data.session) {
        setError(t("auth.signUp.errorVerify"));
        return;
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signUp.errorFallback"));
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setDemoSession();
    router.replace("/");
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
            <Text style={styles.eyebrow}>{t("auth.signUp.eyebrow")}</Text>
            <Text style={styles.title}>{t("auth.signUp.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.signUp.subtitle")}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("auth.signUp.namePlaceholder")}
              autoCapitalize="words"
              autoComplete="name"
            />
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.signUp.emailPlaceholder")}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.signUp.passwordPlaceholder")}
              secureTextEntry
              autoComplete="new-password"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={t("auth.signUp.submit")}
              variant="primary"
              loading={loading}
              onPress={handleSignUp}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("auth.signUp.or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest */}
          <Button title={t("auth.signUp.guest")} variant="ghost" onPress={handleGuest} />

          {/* Sign in link */}
          <Pressable onPress={() => router.push("/(auth)/sign-in")}>
            <Text style={styles.signInLink}>
              {t("auth.signUp.signIn")}
              <Text style={styles.signInLinkAccent}>{t("auth.signUp.signInAccent")}</Text>
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
    color: colors.inkFaint,
  },
  signInLink: {
    fontFamily: FONTS.sansMedium,
    fontSize: 14,
    color: colors.inkMid,
    textAlign: "center",
  },
  signInLinkAccent: {
    color: colors.accent,
  },
});
