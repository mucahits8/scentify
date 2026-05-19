import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/components/theme/ThemeProvider";
import { topDimensions } from "@/utils/helpers";
import type { ScentDNAProfile } from "@/utils/types";

export function RadarChart({ profile }: { profile: ScentDNAProfile }) {
  const { colors } = useTheme();
  const items = topDimensions(profile, 6);
  const size = 276;
  const center = size / 2;
  const radius = 96;
  const labelOffset = 20;
  const averageScore = Math.round(items.reduce((total, item) => total + item.value, 0) / Math.max(1, items.length));

  const vertices = items.map((item, index) => {
    const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
    const axisX = center + Math.cos(angle) * radius;
    const axisY = center + Math.sin(angle) * radius;
    const valueRadius = (item.value / 100) * radius;
    const valueX = center + Math.cos(angle) * valueRadius;
    const valueY = center + Math.sin(angle) * valueRadius;
    const labelX = center + Math.cos(angle) * (radius + labelOffset);
    const labelY = center + Math.sin(angle) * (radius + labelOffset);

    return {
      key: item.key,
      value: item.value,
      axisX,
      axisY,
      valueX,
      valueY,
      labelX,
      labelY,
    };
  });

  const points = vertices
    .map((vertex) => `${vertex.valueX},${vertex.valueY}`)
    .join(" ");

  const gridRings = [1, 0.75, 0.5, 0.25];

  const textAnchor = (x: number): "start" | "middle" | "end" => {
    if (x > center + 6) return "start";
    if (x < center - 6) return "end";
    return "middle";
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartFrame}>
        <Svg width={size} height={size}>
          {gridRings.map((ring) => (
            <Circle
              key={ring}
              cx={center}
              cy={center}
              r={radius * ring}
              stroke={ring === 1 ? colors.border : colors.borderLight}
              strokeWidth={1}
              fill="transparent"
            />
          ))}

          {vertices.map((vertex) => (
            <Line
              key={`axis-${vertex.key}`}
              x1={center}
              y1={center}
              x2={vertex.axisX}
              y2={vertex.axisY}
              stroke={colors.borderLight}
              strokeWidth={1}
            />
          ))}

          <Polygon points={points} fill={colors.accentLight} stroke={colors.accent} strokeWidth={2} />

          {vertices.map((vertex) => (
            <Circle
              key={`point-${vertex.key}`}
              cx={vertex.valueX}
              cy={vertex.valueY}
              r={3.5}
              fill={colors.dna[vertex.key]}
              stroke={colors.surface}
              strokeWidth={1.2}
            />
          ))}

          {vertices.map((vertex) => (
            <SvgText
              key={`label-${vertex.key}`}
              x={vertex.labelX}
              y={vertex.labelY}
              fill={colors.inkFaint}
              fontSize="11"
              fontWeight="600"
              textAnchor={textAnchor(vertex.labelX)}
            >
              {vertex.key}
            </SvgText>
          ))}
        </Svg>

        <View style={[styles.centerBadge, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.centerValue, { color: colors.ink }]}>{averageScore}</Text>
          <Text style={[styles.centerLabel, { color: colors.inkFaint }]}>DNA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  chartFrame: {
    width: 276,
    height: 276,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerBadge: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  centerValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  centerLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
