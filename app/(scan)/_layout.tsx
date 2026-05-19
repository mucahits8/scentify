import { Stack } from "expo-router";

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
      <Stack.Screen name="capture" />
      <Stack.Screen name="identifying" />
      <Stack.Screen name="result" />
      <Stack.Screen name="manual" />
    </Stack>
  );
}
