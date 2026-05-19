import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useScanStore } from "@/stores/useScanStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";

export default function ManualScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { runDemoScan } = useScanStore();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    runDemoScan(query.trim());
    router.replace("/(scan)/result");
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.inkMid }]}>‹ Geri</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.ink }]}>Manuel Ara</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.inkMid }]}>
            Parfüm adını veya markasını yazın
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.border }]}
            placeholder="örn. Bleu de Chanel EDP"
            placeholderTextColor={colors.inkFaint}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          <Pressable
            style={[styles.searchBtn, { backgroundColor: query.trim() ? colors.accent : colors.surfaceAlt }]}
            onPress={handleSearch}
            disabled={!query.trim()}
          >
            <Text style={[styles.searchBtnText, { color: query.trim() ? "#fff" : colors.inkFaint }]}>
              Ara ve Eşleştir
            </Text>
          </Pressable>

          <Text style={[styles.hint, { color: colors.inkFaint }]}>
            Katalogumuzda yaklaşık eşleşme aranacak
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 60 },
  backText: { fontFamily: FONTS.sansMedium, fontSize: 16 },
  title: { fontFamily: FONTS.sansSemiBold, fontSize: 17 },
  content: { flex: 1, padding: SPACING.lg, gap: SPACING.md },
  label: { fontFamily: FONTS.sansMedium, fontSize: 14, marginBottom: 4 },
  input: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontFamily: FONTS.sans,
    fontSize: 16,
  },
  searchBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    alignItems: "center",
  },
  searchBtnText: { fontFamily: FONTS.sansSemiBold, fontSize: 16 },
  hint: { fontFamily: FONTS.sans, fontSize: 12, textAlign: "center" },
});
