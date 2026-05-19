export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  surfaceTinted: string;
  tabBar: string;
  heroSurface: string;
  ink: string;
  inkMid: string;
  inkFaint: string;
  text1: string;
  text2: string;
  text3: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  accentMid: string;
  accentForeground: string;
  border: string;
  borderLight: string;
  overlay: string;
  glass: string;
  glassBorder: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  muted: string;
  mutedBg: string;
  warning: string;
  dna: {
    fresh: string;
    woody: string;
    sweet: string;
    citrus: string;
    spicy: string;
    aquatic: string;
    powdery: string;
    musky: string;
    amber: string;
    vanilla: string;
    leather: string;
    floral: string;
    smoky: string;
    oriental: string;
  };
}

const DNA_COLORS = {
  fresh: "#5B9E78",
  woody: "#8B7355",
  sweet: "#C4836A",
  citrus: "#C4A235",
  spicy: "#A06040",
  aquatic: "#5189A6",
  powdery: "#B8A0C4",
  musky: "#7E6E96",
  amber: "#B8963C",
  vanilla: "#D4B07A",
  leather: "#6B5040",
  floral: "#C47A8B",
  smoky: "#6B6B6B",
  oriental: "#8B5A5A",
} as const;

export const LIGHT_COLORS: ThemeColors = {
  bg: "#F4EFE8",
  surface: "#FFFDF9",
  surfaceAlt: "#FBF7F1",
  surfaceMuted: "#EDE6DB",
  surfaceTinted: "#EFE0CE",
  tabBar: "#FBF7F1",
  heroSurface: "#1A1714",
  ink: "#1A1714",
  inkMid: "#5E5146",
  inkFaint: "#9D8F81",
  text1: "#1A1714",
  text2: "#5E5146",
  text3: "#9D8F81",
  accent: "#A87049",
  accentDark: "#8B5A38",
  accentLight: "#F2E2D0",
  accentMid: "rgba(168,112,73,0.14)",
  accentForeground: "#FFF8F1",
  border: "#DED5CA",
  borderLight: "#EAE2D8",
  overlay: "rgba(26,23,20,0.14)",
  glass: "rgba(255,253,249,0.84)",
  glassBorder: "rgba(26,23,20,0.08)",
  success: "#5E8A63",
  successBg: "rgba(94,138,99,0.10)",
  error: "#C75050",
  errorBg: "rgba(199,80,80,0.07)",
  muted: "#907C68",
  mutedBg: "rgba(144,124,104,0.08)",
  warning: "#C4A235",
  dna: DNA_COLORS,
};

export const DARK_COLORS: ThemeColors = {
  bg: "#1C1815",
  surface: "#2D2621",
  surfaceAlt: "#362F29",
  surfaceMuted: "#26201B",
  surfaceTinted: "#43362A",
  tabBar: "#221D18",
  heroSurface: "#171311",
  ink: "#F1E6D6",
  inkMid: "rgba(241,230,214,0.82)",
  inkFaint: "rgba(241,230,214,0.62)",
  text1: "#F1E6D6",
  text2: "rgba(241,230,214,0.82)",
  text3: "rgba(241,230,214,0.62)",
  accent: "#A87049",
  accentDark: "#D8B18F",
  accentLight: "rgba(168,112,73,0.24)",
  accentMid: "rgba(168,112,73,0.34)",
  accentForeground: "#FFF8F1",
  border: "#54473D",
  borderLight: "#67574B",
  overlay: "rgba(15,11,9,0.46)",
  glass: "rgba(34,29,24,0.72)",
  glassBorder: "rgba(241,230,214,0.16)",
  success: "#7CA17A",
  successBg: "rgba(124,161,122,0.14)",
  error: "#D97272",
  errorBg: "rgba(217,114,114,0.12)",
  muted: "#C6A789",
  mutedBg: "rgba(198,167,137,0.12)",
  warning: "#D2B164",
  dna: DNA_COLORS,
};

export function getColorsForTheme(theme: ResolvedTheme): ThemeColors {
  return theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}
