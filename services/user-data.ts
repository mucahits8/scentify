import { calculateScentDNA } from "@/services/dna";
import { getPerfumeById, getPerfumes, mapPerfumeRow, type PerfumeRow } from "@/services/perfumes";
import { isSupabaseConfigured, requireSupabase } from "@/services/supabase";
import type {
  BudgetPreference,
  CollectionItem,
  CollectionStatus,
  GenderPreference,
  IntensityPreference,
  Perfume,
  ScentDNAProfile,
  UserProfile,
} from "@/utils/types";
import { vectorFromArray } from "@/utils/helpers";

type UserRow = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  gender_preference: GenderPreference | null;
  budget_preference: BudgetPreference | null;
  intensity_preference: IntensityPreference | null;
  weather_enabled: boolean;
  is_premium: boolean;
  premium_expires_at: string | null;
  onboarding_completed: boolean;
};

type UserDnaRow = {
  fresh: number;
  woody: number;
  sweet: number;
  citrus: number;
  spicy: number;
  aquatic: number;
  powdery: number;
  musky: number;
  amber: number;
  vanilla: number;
  leather: number;
  floral: number;
  smoky: number;
  oriental: number;
  profile_tags: string[] | null;
  best_families: string[] | null;
  avoid_notes: string[] | null;
};

type CollectionRow = {
  id: string;
  perfume_id: string;
  status: CollectionStatus;
  size: string | null;
  purchase_date: string | null;
  notes: string | null;
  perfume: PerfumeRow | PerfumeRow[] | null;
};

type RatingRow = {
  perfume_id: string;
  score: number;
};

function mapUserRowToProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username ?? undefined,
    fullName: row.full_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    onboardingCompleted: row.onboarding_completed,
    isPremium: row.is_premium,
    premiumExpiresAt: row.premium_expires_at,
    weatherEnabled: row.weather_enabled,
    genderPreference: row.gender_preference ?? undefined,
    budgetPreference: row.budget_preference ?? undefined,
    intensityPreference: row.intensity_preference ?? undefined,
  };
}

function mapDnaRowToProfile(row: UserDnaRow): ScentDNAProfile {
  const profileTags = row.profile_tags ?? [];
  const bestFamilies = row.best_families ?? [];
  const avoidNotes = row.avoid_notes ?? [];
  const summaryLead = profileTags.slice(0, 2).join(", ").toLowerCase();

  return {
    ...vectorFromArray([
      row.fresh,
      row.woody,
      row.sweet,
      row.citrus,
      row.spicy,
      row.aquatic,
      row.powdery,
      row.musky,
      row.amber,
      row.vanilla,
      row.leather,
      row.floral,
      row.smoky,
      row.oriental,
    ]),
    profileTags,
    bestFamilies,
    avoidNotes,
    summary: summaryLead
      ? `You gravitate toward ${summaryLead} fragrances with a balanced, wearable shape.`
      : "Your scent profile is ready to evolve as you keep rating and collecting.",
  };
}

async function getAuthUserId() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error("No authenticated user found.");
  return data.user.id;
}

async function resolvePerfume(perfumeIdOrSlug: string) {
  const perfume = await getPerfumeById(perfumeIdOrSlug);
  if (!perfume) {
    throw new Error("Perfume not found.");
  }
  return perfume;
}

export async function fetchCurrentUserBundle() {
  if (!isSupabaseConfigured) {
    return { profile: null as UserProfile | null, scentDNA: null as ScentDNAProfile | null };
  }

  const supabase = requireSupabase();
  const { data: profileRow, error: profileError } = await supabase
    .from("users")
    .select("*")
    .maybeSingle();

  if (profileError) throw profileError;

  const { data: dnaRow, error: dnaError } = await supabase
    .from("user_scent_dna")
    .select("*")
    .maybeSingle();

  if (dnaError) throw dnaError;

  return {
    profile: profileRow ? mapUserRowToProfile(profileRow as UserRow) : null,
    scentDNA: dnaRow ? mapDnaRowToProfile(dnaRow as UserDnaRow) : null,
  };
}

export async function updateUserProfile(values: {
  fullName?: string;
  location?: string;
  bio?: string;
  genderPreference?: GenderPreference;
  budgetPreference?: BudgetPreference;
  intensityPreference?: IntensityPreference;
  weatherEnabled?: boolean;
}) {
  if (!isSupabaseConfigured) return;

  const supabase = requireSupabase();
  const payload = {
    full_name: values.fullName,
    location: values.location,
    bio: values.bio,
    gender_preference: values.genderPreference,
    budget_preference: values.budgetPreference,
    intensity_preference: values.intensityPreference,
    weather_enabled: values.weatherEnabled,
  };

  const { error } = await supabase.from("users").update(payload).eq("id", await getAuthUserId());
  if (error) throw error;
}

export async function saveOnboardingToSupabase(args: {
  genderPreference?: GenderPreference;
  budgetPreference?: BudgetPreference;
  intensityPreference?: IntensityPreference;
  weatherEnabled: boolean;
  lovedIds: string[];
  dislikedIds: string[];
  ownedIds: string[];
  preferredStyles: string[];
  avoidNotes: string[];
  usageContexts: string[];
  catalogPerfumes?: Perfume[];
}) {
  if (!isSupabaseConfigured) return null;

  const supabase = requireSupabase();
  const userId = await getAuthUserId();
  const sourcePerfumes = args.catalogPerfumes?.length ? args.catalogPerfumes : await getPerfumes(3000);

  const lovedPerfumes = sourcePerfumes.filter((perfume) => args.lovedIds.includes(perfume.id));
  const dislikedPerfumes = sourcePerfumes.filter((perfume) => args.dislikedIds.includes(perfume.id));
  const ownedPerfumes = sourcePerfumes.filter((perfume) => args.ownedIds.includes(perfume.id));
  const scentDNA = calculateScentDNA(
    lovedPerfumes,
    dislikedPerfumes,
    ownedPerfumes,
    args.preferredStyles,
    args.avoidNotes,
  );

  const { error: userError } = await supabase
    .from("users")
    .update({
      onboarding_completed: true,
      gender_preference: args.genderPreference ?? null,
      budget_preference: args.budgetPreference ?? null,
      intensity_preference: args.intensityPreference ?? null,
      weather_enabled: args.weatherEnabled,
    })
    .eq("id", userId);

  if (userError) throw userError;

  const { error: prefDeleteError } = await supabase
    .from("user_perfume_preferences")
    .delete()
    .eq("user_id", userId);
  if (prefDeleteError) throw prefDeleteError;

  const preferenceRows = [
    ...args.lovedIds.map((perfumeId) => ({ user_id: userId, perfume_id: perfumeId, preference_type: "love" })),
    ...args.dislikedIds.map((perfumeId) => ({ user_id: userId, perfume_id: perfumeId, preference_type: "dislike" })),
    ...args.ownedIds.map((perfumeId) => ({ user_id: userId, perfume_id: perfumeId, preference_type: "own" })),
  ];

  if (preferenceRows.length > 0) {
    const { error: prefInsertError } = await supabase.from("user_perfume_preferences").insert(preferenceRows);
    if (prefInsertError) throw prefInsertError;
  }

  const { error: styleDeleteError } = await supabase
    .from("user_style_preferences")
    .delete()
    .eq("user_id", userId);
  if (styleDeleteError) throw styleDeleteError;

  const styleRows = [
    ...args.preferredStyles.map((style) => ({ user_id: userId, style, is_avoid: false })),
    ...args.avoidNotes.map((style) => ({ user_id: userId, style, is_avoid: true })),
  ];
  if (styleRows.length > 0) {
    const { error: styleInsertError } = await supabase.from("user_style_preferences").insert(styleRows);
    if (styleInsertError) throw styleInsertError;
  }

  const { error: contextDeleteError } = await supabase
    .from("user_context_preferences")
    .delete()
    .eq("user_id", userId);
  if (contextDeleteError) throw contextDeleteError;

  if (args.usageContexts.length > 0) {
    const { error: contextInsertError } = await supabase
      .from("user_context_preferences")
      .insert(args.usageContexts.map((context) => ({ user_id: userId, context })));
    if (contextInsertError) throw contextInsertError;
  }

  const { error: dnaError } = await supabase.from("user_scent_dna").upsert(
    {
      user_id: userId,
      fresh: scentDNA.fresh,
      woody: scentDNA.woody,
      sweet: scentDNA.sweet,
      citrus: scentDNA.citrus,
      spicy: scentDNA.spicy,
      aquatic: scentDNA.aquatic,
      powdery: scentDNA.powdery,
      musky: scentDNA.musky,
      amber: scentDNA.amber,
      vanilla: scentDNA.vanilla,
      leather: scentDNA.leather,
      floral: scentDNA.floral,
      smoky: scentDNA.smoky,
      oriental: scentDNA.oriental,
      profile_tags: scentDNA.profileTags,
      best_families: scentDNA.bestFamilies,
      avoid_notes: scentDNA.avoidNotes,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (dnaError) throw dnaError;

  if (ownedPerfumes.length > 0) {
    const { error: collectionError } = await supabase.from("collections").upsert(
      ownedPerfumes.map((perfume) => ({
        user_id: userId,
        perfume_id: perfume.id,
        status: "owned",
      })),
      { onConflict: "user_id,perfume_id" },
    );
    if (collectionError) throw collectionError;
  }

  return scentDNA;
}

export async function fetchMyCollection() {
  if (!isSupabaseConfigured) return [] as CollectionItem[];

  const supabase = requireSupabase();
  const userId = await getAuthUserId();
  const { data: collectionRows, error: collectionError } = await supabase
    .from("collections")
    .select(`
      id,
      perfume_id,
      status,
      size,
      purchase_date,
      notes,
      perfume:perfumes(*)
    `)
    .order("created_at", { ascending: false });

  if (collectionError) throw collectionError;

  const { data: ratingRows, error: ratingError } = await supabase
    .from("ratings")
    .select("perfume_id,score")
    .eq("user_id", userId);

  if (ratingError) throw ratingError;

  const ratingByPerfumeId = new Map<string, number>(
    ((ratingRows ?? []) as RatingRow[]).map((row) => [row.perfume_id, Number(row.score)]),
  );

  const items: CollectionItem[] = [];
  ((collectionRows ?? []) as CollectionRow[]).forEach((row) => {
    const perfumePayload = Array.isArray(row.perfume) ? row.perfume[0] : row.perfume;
    if (!perfumePayload) return;

    items.push({
      id: row.id,
      perfume: mapPerfumeRow(perfumePayload),
      status: row.status,
      size: row.size ?? undefined,
      notes: row.notes ?? undefined,
      purchaseDate: row.purchase_date ?? undefined,
      rating: ratingByPerfumeId.get(row.perfume_id),
    });
  });

  return items;
}

export async function upsertCollectionItem(perfumeIdOrSlug: string, status: CollectionStatus) {
  if (!isSupabaseConfigured) return null;
  const userId = await getAuthUserId();
  const perfume = await resolvePerfume(perfumeIdOrSlug);

  const { error } = await requireSupabase().from("collections").upsert(
    {
      user_id: userId,
      perfume_id: perfume.id,
      status,
    },
    { onConflict: "user_id,perfume_id" },
  );

  if (error) throw error;
  return perfume;
}

export async function upsertRating(perfumeIdOrSlug: string, score: number) {
  if (!isSupabaseConfigured) return null;

  const userId = await getAuthUserId();
  const perfume = await resolvePerfume(perfumeIdOrSlug);
  const roundedScore = Math.max(0.5, Math.min(5, Math.round(score * 10) / 10));

  const { error: ratingError } = await requireSupabase().from("ratings").upsert(
    {
      user_id: userId,
      perfume_id: perfume.id,
      score: roundedScore,
    },
    { onConflict: "user_id,perfume_id" },
  );

  if (ratingError) throw ratingError;

  const { error: collectionError } = await requireSupabase().from("collections").upsert(
    {
      user_id: userId,
      perfume_id: perfume.id,
      status: "sampled",
    },
    { onConflict: "user_id,perfume_id" },
  );
  if (collectionError) throw collectionError;

  return perfume;
}
