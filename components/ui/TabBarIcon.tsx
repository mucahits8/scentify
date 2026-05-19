import Svg, { Path, Rect, Circle } from "react-native-svg";

type TabBarIconName =
  | "home"
  | "discover"
  | "collection"
  | "profile"
  | "chevron-right"
  | "chevron-left"
  | "sparkle"
  | "filter"
  | "heart"
  | "star"
  | "bookmark"
  | "dots"
  | "journal"
  | "bell";

interface TabBarIconProps {
  name: TabBarIconName;
  color: string;
  size?: number;
  focused?: boolean;
}

export function TabBarIcon({ name, color, size = 22, focused = false }: TabBarIconProps) {
  const strokeWidth = focused ? 2.1 : 1.85;

  if (name === "chevron-right") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="m9 6 6 6-6 6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "chevron-left") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="m15 6-6 6 6 6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "sparkle") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3.75 13.8 8.2 18.25 10 13.8 11.8 12 16.25 10.2 11.8 5.75 10 10.2 8.2 12 3.75Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M18 4.75v2.5M19.25 6h-2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </Svg>
    );
  }

  if (name === "filter") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 7.25h14"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <Path
          d="M7.75 12h8.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <Path
          d="M10.25 16.75h3.5"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (name === "heart") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 19.25s-6.25-3.83-6.25-8.84A3.66 3.66 0 0 1 9.44 6.75c1.16 0 2.09.5 2.56 1.3.47-.8 1.4-1.3 2.56-1.3a3.66 3.66 0 0 1 3.69 3.66c0 5-6.25 8.84-6.25 8.84Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "star") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="m12 4.75 2.12 4.29 4.73.69-3.42 3.33.8 4.71L12 15.55 7.77 17.77l.8-4.71-3.42-3.33 4.73-.69L12 4.75Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "bookmark") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8 5.25h8A1.75 1.75 0 0 1 17.75 7v12l-5.75-3-5.75 3V7A1.75 1.75 0 0 1 8 5.25Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "dots") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="6.5" cy="12" r="1.4" fill={color} />
        <Circle cx="12" cy="12" r="1.4" fill={color} />
        <Circle cx="17.5" cy="12" r="1.4" fill={color} />
      </Svg>
    );
  }

  if (name === "journal") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="5"
          y="4.75"
          width="14"
          height="14.5"
          rx="2.5"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M9 8.25h6M9 12h6M9 15.75h4"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (name === "bell") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7.25 9.75a4.75 4.75 0 1 1 9.5 0v3.4c0 .58.2 1.15.57 1.6l.93 1.15H5.75l.93-1.15c.36-.45.57-1.02.57-1.6v-3.4Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10.25 17.75a1.75 1.75 0 0 0 3.5 0"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (name === "home") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4.75 10.25L12 4.5l7.25 5.75v8a1.75 1.75 0 0 1-1.75 1.75h-11A1.75 1.75 0 0 1 4.75 18.25v-8Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.25 19.75V13.5h5.5v6.25"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "discover") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="4.25"
          y="6.25"
          width="15.5"
          height="11.5"
          rx="2.75"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M8 6.25 9.2 4.5h5.6L16 6.25"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
      </Svg>
    );
  }

  if (name === "collection") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 4.75h6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <Path
          d="M10.25 4.75v3.1l-3.4 3.5a2.7 2.7 0 0 0-.77 1.87v4.03A2.75 2.75 0 0 0 8.83 20h6.34a2.75 2.75 0 0 0 2.75-2.75v-4.03a2.7 2.7 0 0 0-.77-1.87l-3.4-3.5v-3.1"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M8.5 13.25c1.4.85 5.6.85 7 0"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.25" r="3.25" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5.75 19c1.35-2.8 3.6-4.2 6.25-4.2s4.9 1.4 6.25 4.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
