import { useMemo } from "react";
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from "react-native";
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

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language } = useI18n();
  const setBoolean = useSocialPrefsStore((s) => s.setBoolean);
  const pushSocial = useSocialPrefsStore((s) => s.pushSocial);
  const pushReminders = useSocialPrefsStore((s) => s.pushReminders);
  const pushWishlist = useSocialPrefsStore((s) => s.pushWishlist);
  const pushPriceDrop = useSocialPrefsStore((s) => s.pushPriceDrop);
  const stylesMemo = useMemo(() => createStyles(colors), [colors]);

  const copy =
    language === "tr"
      ? {
          title: "Bildirim Tercihleri",
          subtitle: "Push ve etkileşim",
          social: "Sosyal bildirimler",
          socialDesc: "Yorum, yanıt ve etkileşim güncellemeleri.",
          reminders: "Hatırlatmalar",
          remindersDesc: "Haftalık DNA ve kullanım hatırlatmaları.",
          wishlist: "Wishlist uyarıları",
          wishlistDesc: "Takipteki kokular için stok bilgileri.",
          priceDrop: "Fiyat düşüşleri",
          priceDropDesc: "Kaydedilen ürünlerde indirim olduğunda haber ver.",
          openInbox: "Bildirim Kutusunu Aç",
        }
      : {
          title: "Notification Preferences",
          subtitle: "Push & Activity",
          social: "Social updates",
          socialDesc: "Comments, replies and interaction updates.",
          reminders: "Reminders",
          remindersDesc: "Weekly DNA and wear reminders.",
          wishlist: "Wishlist alerts",
          wishlistDesc: "Stock alerts for followed scents.",
          priceDrop: "Price drops",
          priceDropDesc: "Notify when saved perfumes drop in price.",
          openInbox: "Open Inbox",
        };

  return (
    <SafeAreaView style={stylesMemo.root}>
      <StackHeader title={copy.title} subtitle={copy.subtitle} onBack={() => router.back()} />
      <View style={stylesMemo.content}>
        <ToggleRow label={copy.social} description={copy.socialDesc} value={pushSocial} onChange={(v) => setBoolean("pushSocial", v)} />
        <ToggleRow label={copy.reminders} description={copy.remindersDesc} value={pushReminders} onChange={(v) => setBoolean("pushReminders", v)} />
        <ToggleRow label={copy.wishlist} description={copy.wishlistDesc} value={pushWishlist} onChange={(v) => setBoolean("pushWishlist", v)} />
        <ToggleRow label={copy.priceDrop} description={copy.priceDropDesc} value={pushPriceDrop} onChange={(v) => setBoolean("pushPriceDrop", v)} />
        <Pressable style={stylesMemo.linkButton} onPress={() => router.push("/notifications" as never)}>
          <Text style={stylesMemo.linkButtonText}>{copy.openInbox}</Text>
        </Pressable>
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
    linkButton: {
      marginTop: SPACING.md,
      alignSelf: "center",
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    linkButtonText: {
      fontFamily: FONTS.sansSemiBold,
      fontSize: 13,
      color: colors.accent,
    },
  });
