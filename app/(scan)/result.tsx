import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { ScanCandidateCard } from "@/components/scan/ScanCandidateCard";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useScanStore } from "@/stores/useScanStore";
import { buildStubPerfume } from "@/services/scan/matchPerfume";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";
import type { ScanMatch } from "@/services/scan/types";

export default function ResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { status, matches, visionResult, confirmedPerfumeIds, confirmMatch, reset } = useScanStore();
  const addItem = useCollectionStore((s) => s.addItem);

  const validMatches = matches.filter((m) => m.matchedBy !== "none");
  const hasResults = validMatches.length > 0;
  const isNotRecognizable = visionResult?.notRecognizable || (!hasResults && status === "done");

  const handleConfirm = async (match: ScanMatch) => {
    const perfume = match.perfume ?? buildStubPerfume(match.candidate);
    await addItem(perfume.id, "owned");
    confirmMatch(match);
  };

  const handleDone = () => {
    reset();
    router.dismissAll();
  };

  const handleRetry = () => {
    reset();
    router.replace("/(scan)/capture");
  };

  const handleManual = () => {
    router.replace("/(scan)/manual");
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleRetry} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.inkMid }]}>Tekrar Tara</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Sonuçlar</Text>
        <Pressable onPress={handleDone} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.accent }]}>
            {confirmedPerfumeIds.length > 0 ? "Bitti" : "Kapat"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isNotRecognizable ? (
          <NotRecognizableState onManual={handleManual} onRetry={handleRetry} colors={colors} />
        ) : hasResults ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>
              {validMatches.length} eşleşme bulundu
            </Text>
            {validMatches.map((match, idx) => (
              <ScanCandidateCard
                key={idx}
                match={match}
                confirmed={confirmedPerfumeIds.includes(match.perfume?.id ?? match.candidate.name)}
                onConfirm={() => handleConfirm(match)}
              />
            ))}
            {confirmedPerfumeIds.length > 0 && (
              <View style={[styles.addedBanner, { backgroundColor: colors.successBg }]}>
                <Text style={[styles.addedText, { color: colors.success }]}>
                  ✓ {confirmedPerfumeIds.length} parfüm koleksiyonuna eklendi
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emoji}>⏳</Text>
            <Text style={[styles.loadingText, { color: colors.ink }]}>İşleniyor…</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotRecognizableState({ onManual, onRetry, colors }: { onManual: () => void; onRetry: () => void; colors: any }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🤔</Text>
      <Text style={[styles.notFoundTitle, { color: colors.ink }]}>Parfüm tanınamadı</Text>
      <Text style={[styles.notFoundSub, { color: colors.inkMid }]}>
        Fotoğraf net olmayabilir ya da bu parfüm kataloğumuzda yok.
      </Text>
      <Pressable style={[styles.outlineBtn, { borderColor: colors.accent }]} onPress={onManual}>
        <Text style={[styles.outlineBtnText, { color: colors.accent }]}>Manuel Ekle</Text>
      </Pressable>
      <Pressable style={[styles.ghostBtn]} onPress={onRetry}>
        <Text style={[styles.ghostBtnText, { color: colors.inkMid }]}>Tekrar Dene</Text>
      </Pressable>
    </View>
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
  headerBtn: { minWidth: 60 },
  headerBtnText: { fontFamily: FONTS.sansMedium, fontSize: 15 },
  headerTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 17 },
  content: { padding: SPACING.lg, gap: 0 },
  sectionLabel: { fontFamily: FONTS.sansMedium, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: SPACING.sm },
  addedBanner: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
  },
  addedText: { fontFamily: FONTS.sansSemiBold, fontSize: 14 },
  center: { alignItems: "center", paddingVertical: 60, gap: SPACING.sm },
  emoji: { fontSize: 52, marginBottom: SPACING.sm },
  loadingText: { fontFamily: FONTS.sansMedium, fontSize: 16 },
  notFoundTitle: { fontFamily: FONTS.sansBold, fontSize: 20 },
  notFoundSub: { fontFamily: FONTS.sans, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 },
  outlineBtn: {
    marginTop: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  outlineBtnText: { fontFamily: FONTS.sansSemiBold, fontSize: 15 },
  ghostBtn: { marginTop: SPACING.sm, paddingVertical: 8 },
  ghostBtnText: { fontFamily: FONTS.sansMedium, fontSize: 14 },
});
