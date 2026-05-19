import { View, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const FRAME = width * 0.75;
const CORNER = 24;
const BORDER = 3;

const C = "#A78BFA"; // accent purple

export function ScanFrameOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.frame}>
        {/* top-left */}
        <View style={[styles.corner, { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 }]} />
        {/* top-right */}
        <View style={[styles.corner, { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
        {/* bottom-left */}
        <View style={[styles.corner, { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 }]} />
        {/* bottom-right */}
        <View style={[styles.corner, { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: FRAME,
    height: FRAME * 1.35,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: C,
    borderWidth: BORDER,
    borderRadius: 4,
  },
});
