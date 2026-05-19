import { type ReactNode } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { StackHeader } from "@/components/ui/StackHeader";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useMotionStore, type MotionPreference } from "@/stores/useMotionStore";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";
import type { ThemeMode } from "@/utils/theme";

type SegmentOption<T extends string> = { key: T; label: string };

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: SPACING.sm }}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            style={{
              flex: 1,
              paddingVertical: SPACING.sm,
              borderRadius: RADIUS.md,
              alignItems: "center",
              backgroundColor: active ? colors.accent : colors.surfaceAlt,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.border,
            }}
            onPress={() => onChange(opt.key)}
          >
            <Text
              style={{
                fontFamily: FONTS.sansMedium,
                fontSize: 13,
                color: active ? "#FFF8F1" : colors.inkMid,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: SPACING.md }}>
      <Text
        style={{
          fontFamily: FONTS.sansBold,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: colors.accent,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function NavRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 14, color: colors.ink }}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {value ? <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: colors.inkFaint }}>{value}</Text> : null}
        <TabBarIcon name="chevron-right" color={colors.inkFaint} size={16} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language } = useI18n();

  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const appLanguage = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const motionPref = useMotionStore((s) => s.preference);
  const setMotionPref = useMotionStore((s) => s.setPreference);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clear);
  const setProfile = useUserStore((s) => s.setProfile);
  const profile = useUserStore((s) => s.profile);
  const clearCollection = useCollectionStore((s) => s.clear);
  const resetSocialPrefs = useSocialPrefsStore((s) => s.resetSocialPrefs);
  const blockedUsersCount = useSocialPrefsStore((s) => s.blockedUsers.length);
  const savedCount = useSocialPrefsStore((s) => s.savedPostIds.length);
  const archivedCount = useSocialPrefsStore((s) => s.archivedPostIds.length);

  const THEME_OPTS: SegmentOption<ThemeMode>[] = [
    { key: "system", label: t("profile.system") },
    { key: "dark", label: t("profile.dark") },
    { key: "light", label: t("profile.light") },
  ];

  const LANG_OPTS: SegmentOption<"tr" | "en">[] = [
    { key: "tr", label: "Türkçe" },
    { key: "en", label: "English" },
  ];

  const MOTION_OPTS: SegmentOption<MotionPreference>[] = [
    { key: "cinematic", label: "Cinematic" },
    { key: "balanced", label: "Balanced" },
    { key: "minimal", label: "Minimal" },
  ];

  const copy =
    language === "tr"
      ? {
          title: "Ayarlar",
          subtitle: "Hesap ve Uygulama",
          account: "Hesap",
          app: "Uygulama",
          socials: "Sosyal ve Gizlilik",
          danger: "Riskli İşlemler",
          notifPrefs: "Bildirim Tercihleri",
          privacy: "Gizlilik Ayarları",
          blocked: "Engellenen Kullanıcılar",
          savedPosts: "Kaydedilen Gönderiler",
          archivedPosts: "Arşivlenen Gönderiler",
          paywall: "Premium Yönetimi",
          paywallMeta: "Paket / yükseltme",
          signOut: "Çıkış Yap",
          signOutBody: "Oturumu kapat ve giriş ekranına dön.",
          resetOnboarding: "Onboarding'i Yeniden Başlat",
          resetOnboardingBody: "Tercih adımları baştan açılır.",
          resetPrefs: "Sosyal Tercihleri Sıfırla",
          resetPrefsBody: "Kaydetme/arşiv/gizlilik tercihlerini sıfırla.",
          confirmTitle: "Emin misin?",
          cancel: "Vazgeç",
          confirm: "Devam et",
        }
      : {
          title: "Settings",
          subtitle: "Account & App",
          account: "Account",
          app: "App",
          socials: "Social & Privacy",
          danger: "Danger Zone",
          notifPrefs: "Notification Preferences",
          privacy: "Privacy Settings",
          blocked: "Blocked Users",
          savedPosts: "Saved Posts",
          archivedPosts: "Archived Posts",
          paywall: "Premium",
          paywallMeta: "Plan / upgrade",
          signOut: "Sign Out",
          signOutBody: "Close your session and return to auth.",
          resetOnboarding: "Restart Onboarding",
          resetOnboardingBody: "Preference steps will open again.",
          resetPrefs: "Reset Social Preferences",
          resetPrefsBody: "Reset saved/archive/privacy preferences.",
          confirmTitle: "Are you sure?",
          cancel: "Cancel",
          confirm: "Continue",
        };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: {
      paddingHorizontal: SPACING.xxl,
      paddingBottom: SPACING.xxxl,
      gap: SPACING.xxxl,
    },
    dangerCard: {
      backgroundColor: colors.errorBg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.error,
      overflow: "hidden",
    },
    dangerRow: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md + 2,
      gap: 3,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dangerTitle: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 14,
      color: colors.error,
    },
    dangerMeta: {
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.error,
      opacity: 0.72,
    },
  });

  const confirmAction = (meta: string, action: () => void) => {
    Alert.alert(copy.confirmTitle, meta, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.confirm, style: "destructive", onPress: action },
    ]);
  };

  const handleSignOut = () => {
    confirmAction(copy.signOutBody, () => {
      clearCollection();
      clearUser();
      clearSession();
      router.replace("/(auth)/welcome" as never);
    });
  };

  const handleResetOnboarding = () => {
    confirmAction(copy.resetOnboardingBody, () => {
      if (profile) {
        setProfile({ ...profile, onboardingCompleted: false });
      }
      router.replace("/(onboarding)/gender" as never);
    });
  };

  const handleResetPrefs = () => {
    confirmAction(copy.resetPrefsBody, () => {
      resetSocialPrefs();
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingGroup title={copy.app}>
          <SegmentControl options={THEME_OPTS} value={themeMode} onChange={setThemeMode} />
          <SegmentControl options={LANG_OPTS} value={appLanguage} onChange={setLanguage} />
          <SegmentControl options={MOTION_OPTS} value={motionPref} onChange={setMotionPref} />
        </SettingGroup>

        <SettingGroup title={copy.socials}>
          <NavRow label={copy.notifPrefs} onPress={() => router.push("/notification-preferences" as never)} />
          <NavRow label={copy.privacy} onPress={() => router.push("/privacy-settings" as never)} />
          <NavRow label={copy.blocked} value={String(blockedUsersCount)} onPress={() => router.push("/blocked-users" as never)} />
          <NavRow label={copy.savedPosts} value={String(savedCount)} onPress={() => router.push("/saved-posts" as never)} />
          <NavRow label={copy.archivedPosts} value={String(archivedCount)} onPress={() => router.push("/archived-posts" as never)} />
        </SettingGroup>

        <SettingGroup title={copy.account}>
          <NavRow label={copy.paywall} value={copy.paywallMeta} onPress={() => router.push("/paywall" as never)} />
        </SettingGroup>

        <SettingGroup title={copy.danger}>
          <View style={styles.dangerCard}>
            <Pressable style={styles.dangerRow} onPress={handleResetOnboarding}>
              <Text style={styles.dangerTitle}>{copy.resetOnboarding}</Text>
              <Text style={styles.dangerMeta}>{copy.resetOnboardingBody}</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.dangerRow} onPress={handleResetPrefs}>
              <Text style={styles.dangerTitle}>{copy.resetPrefs}</Text>
              <Text style={styles.dangerMeta}>{copy.resetPrefsBody}</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.dangerRow} onPress={handleSignOut}>
              <Text style={styles.dangerTitle}>{copy.signOut}</Text>
              <Text style={styles.dangerMeta}>{copy.signOutBody}</Text>
            </Pressable>
          </View>
        </SettingGroup>
      </ScrollView>
    </SafeAreaView>
  );
}
