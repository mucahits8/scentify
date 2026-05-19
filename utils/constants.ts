import { LIGHT_COLORS } from "@/utils/theme";

export const COLORS = LIGHT_COLORS;

export const FONTS = {
  serif: "DMSerifDisplay_400Regular",
  sans: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemiBold: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: "#12100E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: "#12100E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  lift: {
    shadowColor: "#12100E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 5,
  },
} as const;

// Family → gradient stop mapping for placeholder cards
export const FAMILY_GRADIENTS: Record<string, [string, string]> = {
  Fresh:    ["#DCF0E8", "#A8D5BC"],
  Woody:    ["#EAD9C5", "#C4A882"],
  Sweet:    ["#F5E0D8", "#DFA895"],
  Citrus:   ["#FFF0CC", "#F0D070"],
  Spicy:    ["#F5E0D0", "#D4906A"],
  Aquatic:  ["#D8EAF5", "#90C0D8"],
  Powdery:  ["#EDE8F0", "#CCC0D8"],
  Musky:    ["#E8E0F0", "#B8A8CC"],
  Amber:    ["#F0E0B0", "#D4A840"],
  Vanilla:  ["#F5EED8", "#D8C090"],
  Leather:  ["#E0D0C0", "#B89070"],
  Floral:   ["#F5E0E8", "#D8A0B0"],
  Smoky:    ["#E0E0E0", "#B0B0B0"],
  Oriental: ["#F0E0D8", "#C89090"],
  Default:  ["#EDE8E0", "#D4C8B4"],
};

export const SCENT_DIMENSIONS = [
  "fresh", "woody", "sweet", "citrus", "spicy", "aquatic",
  "powdery", "musky", "amber", "vanilla", "leather", "floral", "smoky", "oriental",
] as const;

export const ONBOARDING_STEPS = [
  "gender", "love", "dislike", "owned", "styles", "context", "budget", "weather", "pro",
] as const;

export const SCENT_STYLES = [
  "Fresh", "Woody", "Sweet", "Citrus", "Spicy", "Aquatic",
  "Powdery", "Musky", "Amber", "Vanilla", "Leather", "Floral", "Smoky", "Oriental",
] as const;

export const AVOID_NOTES = [
  "Heavy Oud", "Sweet Vanilla", "Dense Tobacco", "Rose",
  "Patchouli", "Cinnamon", "Coconut", "Lavender",
] as const;

export const USAGE_CONTEXTS = [
  { key: "Daily", icon: "☀️" },
  { key: "Office", icon: "💼" },
  { key: "Date Night", icon: "🌹" },
  { key: "Night Out", icon: "🌙" },
  { key: "Sport", icon: "⚡" },
  { key: "Special", icon: "✨" },
] as const;

export const BUDGET_OPTIONS = [
  { value: "affordable", label: "$",    description: "Easy everyday buys",           range: "Under $80" },
  { value: "mid",        label: "$$",   description: "A balanced sweet spot",        range: "$80 – $160" },
  { value: "premium",    label: "$$$",  description: "Designer and niche favorites", range: "$160 – $260" },
  { value: "luxury",     label: "$$$$", description: "High-end signature bottles",   range: "$260+" },
] as const;

export const FREE_RECOMMENDATION_LIMIT = 3;
export const FREE_COLLECTION_LIMIT = 15;
