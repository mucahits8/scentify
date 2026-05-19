import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useScanStore } from "@/stores/useScanStore";
import { FONTS, SPACING } from "@/utils/constants";

const DOTS = 3;

export default function IdentifyingScreen() {
  const router = useRouter();
  const { status, imageUri } = useScanStore();
  const dots = useRef(Array.from({ length: DOTS }, () => new Animated.Value(0))).current;

  // Pulse dots
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  // Navigate when scan completes
  useEffect(() => {
    if (status === "done" || status === "error") {
      router.replace("/(scan)/result");
    }
  }, [status]);

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={["#1a0a2e", "#0a0a0a"]} style={StyleSheet.absoluteFill} />

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" blurRadius={3} />
      ) : null}
      <LinearGradient colors={["transparent", "#0a0a0a"]} style={styles.fadeBottom} />

      <View style={styles.content}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Parfüm tanınıyor…</Text>
        <Text style={styles.sub}>Yapay zeka görüntüyü analiz ediyor</Text>

        <View style={styles.dots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: dot, transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }] }]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  preview: { ...StyleSheet.absoluteFillObject },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  emoji: { fontSize: 52, marginBottom: SPACING.sm },
  title: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 22, textAlign: "center" },
  sub: { color: "rgba(255,255,255,0.5)", fontFamily: FONTS.sans, fontSize: 14, textAlign: "center" },
  dots: { flexDirection: "row", gap: 8, marginTop: SPACING.lg },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#A78BFA" },
});
