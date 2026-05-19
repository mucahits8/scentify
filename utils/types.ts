import { SCENT_DIMENSIONS } from "@/utils/constants";

export type GenderPreference = "men" | "women" | "all";
export type BudgetPreference = "affordable" | "mid" | "premium" | "luxury";
export type IntensityPreference = "light" | "moderate" | "strong";
export type CollectionStatus = "owned" | "wishlist" | "want_to_try" | "sampled";
export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type ScentDimension = (typeof SCENT_DIMENSIONS)[number];
export type ScentVector = Record<ScentDimension, number>;

export interface Perfume {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  brandSlug?: string;
  sourceUrl?: string;
  country?: string;
  imageUrl?: string;
  gender: "men" | "women" | "unisex";
  year?: number;
  concentration?: string;
  perfumers?: string[];
  topNotes: string[];
  midNotes: string[];
  baseNotes: string[];
  families: string[];
  longevity: number;
  projection: number;
  seasons: string[];
  occasions: string[];
  impressions: string[];
  priceRange: PriceRange;
  scentVector: number[];
  ratingAvg?: number;
  ratingCount?: number;
}

export interface Recommendation {
  perfumeId: string;
  perfume: Perfume;
  matchScore: number;
  reason: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  onboardingCompleted: boolean;
  isPremium: boolean;
  premiumExpiresAt?: string | null;
  weatherEnabled: boolean;
  genderPreference?: GenderPreference;
  budgetPreference?: BudgetPreference;
  intensityPreference?: IntensityPreference;
}

export interface ScentDNAProfile extends ScentVector {
  profileTags: string[];
  bestFamilies: string[];
  avoidNotes: string[];
  summary: string;
}

export interface CollectionItem {
  id: string;
  perfume: Perfume;
  status: CollectionStatus;
  size?: string;
  notes?: string;
  purchaseDate?: string;
  rating?: number;
}

export interface WeatherSnapshot {
  city?: string;
  temp: number;
  condition: string;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  country?: string | null;
  perfumeCount: number;
  imageUrl?: string | null;
  heroImageUrl?: string | null;
  tagline?: string | null;
}

export interface Perfumer {
  id: string;
  slug: string;
  name: string;
  perfumeCount: number;
  signatureFamilies: string[];
  brands: string[];
  portraitUrl?: string | null;
  city?: string | null;
  country?: string | null;
  quote?: string | null;
}
