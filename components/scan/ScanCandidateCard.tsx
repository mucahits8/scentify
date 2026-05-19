import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { FONTS, RADIUS, SHADOWS, SPACING } from "@/utils/constants";
import type { ScanMatch } from "@/services/scan/types";

interface Props {
  match: ScanMatch;
  confirmed: boolean;
  onConfirm: () => void;
}

export function ScanCandidateCard({ match, confirmed, onConfirm }: Props) {
  const { colors } = useTheme();
  const confidencePct = Math.round((match.candidate.confidence ?? match.matchScore) * 100);
  const hasMatch = match.perfume !== null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: confirmed ? colors.accent : colors.border }]}>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.inkFaint }]} numberOfLines={1}>
          {match.candidate.brand}
        </Text>
        <Text style={[styles.name, { color: colors.ink }]} numberOfLines={2}>
          {match.candidate.name}
        </Text>
        {match.candidate.concentration ? (
          <Text style={[styles.tag, { color: colors.inkMid }]}>{match.candidate.concentration}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: hasMatch ? colors.accentLight : colors.mutedBg }]}>
          <Text style={[styles.badgeText, { color: hasMatch ? colors.accent : colors.inkMid }]}>
            {confidencePct}%
          </Text>
        </View>

        <Pressable
          style={[styles.btn, { backgroundColor: confirmed ? colors.accent : colors.accentLight }]}
          onPress={onConfirm}
        >
          <Text style={[styles.btnText, { color: confirmed ? "#fff" : colors.accent }]}>
            {confirmed ? "✓ Eklendi" : "Ekle"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.soft,
  },
  info: { flex: 1, marginRight: SPACING.sm },
  brand: { fontFamily: FONTS.sansMedium, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  name: { fontFamily: FONTS.sansSemiBold, fontSize: 16, lineHeight: 22 },
  tag: { fontFamily: FONTS.sans, fontSize: 12, marginTop: 4 },
  right: { alignItems: "center", gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: { fontFamily: FONTS.sansSemiBold, fontSize: 12 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  btnText: { fontFamily: FONTS.sansSemiBold, fontSize: 13 },
});
