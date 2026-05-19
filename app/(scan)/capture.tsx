import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { ScanFrameOverlay } from "@/components/scan/ScanFrameOverlay";
import { captureFromCamera, pickFromLibrary } from "@/services/scan/imagePrep";
import { useScanStore } from "@/stores/useScanStore";
import { FONTS, RADIUS, SPACING } from "@/utils/constants";

export default function CaptureScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { runScan } = useScanStore();

  const handleCamera = async () => {
    const img = await captureFromCamera();
    if (!img) return;
    useScanStore.setState({ imageUri: img.uri });
    router.replace("/(scan)/identifying");
    await runScan(img);
  };

  const handleLibrary = async () => {
    const img = await pickFromLibrary();
    if (!img) return;
    useScanStore.setState({ imageUri: img.uri });
    router.replace("/(scan)/identifying");
    await runScan(img);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: "#0a0a0a" }]}>
      <LinearGradient
        colors={["#1a0a2e", "#0a0a0a"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Parfüm Tara</Text>
        <Pressable onPress={() => router.push("/(scan)/manual")} style={styles.manualBtn}>
          <Text style={styles.manualText}>Manuel</Text>
        </Pressable>
      </View>

      {/* Viewfinder area */}
      <View style={styles.viewfinder}>
        <ScanFrameOverlay />
        <Text style={styles.hint}>Parfüm şişesini çerçeve içine alın</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.1)" }]} onPress={handleLibrary}>
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionLabel}>Galeriden Seç</Text>
        </Pressable>

        <Pressable style={[styles.cameraBtn]} onPress={handleCamera}>
          <View style={styles.cameraBtnInner} />
        </Pressable>

        <View style={styles.actionBtn} />
      </View>
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  closeText: { color: "#fff", fontSize: 18 },
  title: { color: "#fff", fontFamily: FONTS.sansSemiBold, fontSize: 17 },
  manualBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  manualText: { color: "#A78BFA", fontFamily: FONTS.sansMedium, fontSize: 14 },
  viewfinder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    bottom: 24,
    color: "rgba(255,255,255,0.6)",
    fontFamily: FONTS.sans,
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  actionBtn: {
    width: 64,
    alignItems: "center",
    gap: 4,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { color: "#fff", fontFamily: FONTS.sans, fontSize: 11, textAlign: "center" },
  cameraBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  cameraBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
});
