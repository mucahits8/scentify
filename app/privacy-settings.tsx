import { useMemo } from "react";
import { Alert, SafeAreaView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StackHeader } from "@/components/ui/StackHeader";
import { useSocialPrefsStore } from "@/stores/useSocialPrefsStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 14, color: colors.ink }}>{label}</Text>
        <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: colors.inkMid }}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useI18n();
  const stylesMemo = useMemo(() => createStyles(colors), [colors]);
  const setBoolean = useSocialPrefsStore((s) => s.setBoolean);
  const isPrivateProfile = useSocialPrefsStore((s) => s.isPrivateProfile);
  const hideCollectionFromPublic = useSocialPrefsStore((s) => s.hideCollectionFromPublic);
  const allowComments = useSocialPrefsStore((s) => s.allowComments);
  const allowMentions = useSocialPrefsStore((s) => s.allowMentions);
  const showActivityStatus = useSocialPrefsStore((s) => s.showActivityStatus);

  const copy =
    language === "tr"
      ? {
          title: "Gizlilik Ayarları",
          subtitle: "Profil ve etkileşim",
          privateProfile: "Özel profil",
          privateProfileDesc: "Sadece onayladığın kişiler profilini görür.",
          hideCollection: "Koleksiyonumu gizle",
          hideCollectionDesc: "Profildeki koleksiyon görünürlüğünü kapat.",
          allowComments: "Yorumlara izin ver",
          allowCommentsDesc: "Gönderilerine yorum yapılabilsin.",
          allowMentions: "Etiketlenmeye izin ver",
          allowMentionsDesc: "Diğer kullanıcılar seni mention edebilir.",
          activity: "Aktiflik durumu",
          activityDesc: "Son aktiflik bilgisini profilde göster.",
          blockedNote: "Engellediğin kullanıcıları ayrı ekrandan yönetebilirsin.",
        }
      : {
          title: "Privacy Settings",
          subtitle: "Profile & Interactions",
          privateProfile: "Private profile",
          privateProfileDesc: "Only approved users can view your profile.",
          hideCollection: "Hide my collection",
          hideCollectionDesc: "Turn off collection visibility on profile.",
          allowComments: "Allow comments",
          allowCommentsDesc: "Let others comment on your posts.",
          allowMentions: "Allow mentions",
          allowMentionsDesc: "Allow other users to mention you.",
          activity: "Activity status",
          activityDesc: "Show your recent activity on profile.",
          blockedNote: "Manage blocked users from the separate screen.",
        };

  const handleToggleComments = (next: boolean) => {
    if (!next) {
      Alert.alert(
        language === "tr" ? "Yorumlar kapanacak" : "Comments will be disabled",
        language === "tr"
          ? "Topluluk etkileşimini azaltabilir. Devam etmek istiyor musun?"
          : "This may reduce community engagement. Continue?",
        [
          { text: language === "tr" ? "Vazgeç" : "Cancel", style: "cancel" },
          { text: language === "tr" ? "Kapat" : "Disable", style: "destructive", onPress: () => setBoolean("allowComments", false) },
        ],
      );
      return;
    }

    setBoolean("allowComments", true);
  };

  return (
    <SafeAreaView style={stylesMemo.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <View style={stylesMemo.content}>
        <ToggleRow label={copy.privateProfile} description={copy.privateProfileDesc} value={isPrivateProfile} onChange={(v) => setBoolean("isPrivateProfile", v)} />
        <ToggleRow label={copy.hideCollection} description={copy.hideCollectionDesc} value={hideCollectionFromPublic} onChange={(v) => setBoolean("hideCollectionFromPublic", v)} />
        <ToggleRow label={copy.allowComments} description={copy.allowCommentsDesc} value={allowComments} onChange={handleToggleComments} />
        <ToggleRow label={copy.allowMentions} description={copy.allowMentionsDesc} value={allowMentions} onChange={(v) => setBoolean("allowMentions", v)} />
        <ToggleRow label={copy.activity} description={copy.activityDesc} value={showActivityStatus} onChange={(v) => setBoolean("showActivityStatus", v)} />
        <Text style={stylesMemo.note}>{copy.blockedNote}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
});

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: SPACING.xxl,
      paddingTop: SPACING.md,
      gap: SPACING.sm,
    },
    note: {
      marginTop: SPACING.sm,
      fontFamily: FONTS.sans,
      fontSize: 12,
      color: colors.inkFaint,
      lineHeight: 18,
    },
  });
