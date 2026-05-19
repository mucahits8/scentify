import { getPerfumeById } from "@/services/perfumes";
import { isSupabaseConfigured, requireSupabase } from "@/services/supabase";

export interface ReviewAuthor {
  id: string;
  name: string;
  headline?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface PerfumeReview {
  id: string;
  perfumeId: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: ReviewAuthor;
}

type PublicProfileRow = {
  user_id: string;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type RatingReviewRow = {
  id: string;
  perfume_id: string;
  user_id: string;
  score: number;
  review_text: string | null;
  created_at: string;
};

const LOCAL_REVIEW_STORE = new Map<string, PerfumeReview[]>();

function clampRating(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function ensureSeeded(perfumeId: string) {
  if (LOCAL_REVIEW_STORE.has(perfumeId)) return;
  const now = Date.now();
  const seeded: PerfumeReview[] = [
    {
      id: `${perfumeId}-seed-1`,
      perfumeId,
      rating: 5,
      comment: "Açılışı temiz, kuruşu dengeli ve günlük kullanımda çok güvenli.",
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      author: {
        id: "seed-deniz",
        name: "Deniz Kaya",
        headline: "Woody + aromatic collector",
      },
    },
    {
      id: `${perfumeId}-seed-2`,
      perfumeId,
      rating: 4,
      comment: "Ofis içinde rahatsız etmiyor, tende oldukça doğal kalıyor.",
      createdAt: new Date(now - 1000 * 60 * 60 * 17).toISOString(),
      author: {
        id: "seed-kaan",
        name: "Kaan Mert",
        headline: "Fresh office signatures",
      },
    },
  ];
  LOCAL_REVIEW_STORE.set(perfumeId, seeded);
}

function mapPublicProfile(row: PublicProfileRow): ReviewAuthor {
  return {
    id: row.user_id,
    name: row.display_name?.trim() || "Scentify User",
    headline: row.headline ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
  };
}

async function getAuthUserId() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error("No authenticated user found.");
  return data.user.id;
}

export async function getPublicProfileById(userId: string): Promise<ReviewAuthor | null> {
  const normalized = userId.trim();
  if (!normalized) return null;

  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await requireSupabase()
      .from("user_public_profiles")
      .select("user_id,display_name,headline,avatar_url,bio")
      .eq("user_id", normalized)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapPublicProfile(data as PublicProfileRow);
  } catch {
    return null;
  }
}

export async function listPerfumeReviews(perfumeId: string, limit = 12): Promise<PerfumeReview[]> {
  const normalized = perfumeId.trim();
  if (!normalized) return [];
  let remoteReviews: PerfumeReview[] | null = null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await requireSupabase()
        .from("ratings")
        .select("id,perfume_id,user_id,score,review_text,created_at")
        .eq("perfume_id", normalized)
        .not("review_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        const reviewRows = (data as RatingReviewRow[]).filter((row) => (row.review_text ?? "").trim().length > 0);
        const userIds = [...new Set(reviewRows.map((row) => row.user_id))];
        const profileById = new Map<string, ReviewAuthor>();

        if (userIds.length > 0) {
          const { data: profileRows } = await requireSupabase()
            .from("user_public_profiles")
            .select("user_id,display_name,headline,avatar_url,bio")
            .in("user_id", userIds);

          (profileRows as PublicProfileRow[] | null)?.forEach((row) => {
            profileById.set(row.user_id, mapPublicProfile(row));
          });
        }

        remoteReviews = reviewRows.map((row) => ({
          id: row.id,
          perfumeId: row.perfume_id,
          rating: clampRating(Number(row.score) || 0),
          comment: String(row.review_text ?? "").trim(),
          createdAt: row.created_at,
          author: profileById.get(row.user_id) ?? {
            id: row.user_id,
            name: "Scentify User",
            headline: "Community member",
          },
        })) satisfies PerfumeReview[];
      }
    } catch {}
  }

  const localReviews = LOCAL_REVIEW_STORE.get(normalized) ?? [];
  if (remoteReviews && remoteReviews.length > 0) {
    const localCustomReviews = localReviews.filter((review) => !review.id.includes("-seed-"));
    if (localCustomReviews.length === 0) {
      return remoteReviews.slice(0, limit);
    }
    const remoteIds = new Set(remoteReviews.map((review) => review.id));
    const merged = [...localCustomReviews.filter((review) => !remoteIds.has(review.id)), ...remoteReviews]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit);
    return merged;
  }

  ensureSeeded(normalized);
  return (LOCAL_REVIEW_STORE.get(normalized) ?? []).slice(0, limit);
}

export async function createPerfumeReview(args: {
  perfumeId: string;
  rating: number;
  comment: string;
  authorId?: string;
  authorName?: string;
}): Promise<PerfumeReview> {
  const perfumeId = args.perfumeId.trim();
  const comment = args.comment.trim();
  const rating = clampRating(args.rating);

  if (!perfumeId) throw new Error("Missing perfume id");
  if (!comment) throw new Error("Missing comment");

  if (isSupabaseConfigured) {
    try {
      const userId = await getAuthUserId();
      const perfume = await getPerfumeById(perfumeId);
      if (!perfume) throw new Error("Perfume not found");

      const { data, error } = await requireSupabase()
        .from("ratings")
        .upsert(
          {
            user_id: userId,
            perfume_id: perfume.id,
            score: rating,
            review_text: comment,
          },
          { onConflict: "user_id,perfume_id" },
        )
        .select("id,perfume_id,user_id,score,review_text,created_at")
        .single();

      if (error) throw error;

      const author = (await getPublicProfileById(userId)) ?? {
        id: userId,
        name: args.authorName?.trim() || "You",
        headline: "Community member",
      };

      return {
        id: String((data as RatingReviewRow).id),
        perfumeId: String((data as RatingReviewRow).perfume_id),
        rating: clampRating(Number((data as RatingReviewRow).score) || 0),
        comment: String((data as RatingReviewRow).review_text ?? "").trim(),
        createdAt: String((data as RatingReviewRow).created_at),
        author,
      };
    } catch {
      // fallback below
    }
  }

  const localReview: PerfumeReview = {
    id: `${perfumeId}-${Date.now()}`,
    perfumeId,
    rating,
    comment,
    createdAt: new Date().toISOString(),
    author: {
      id: args.authorId?.trim() || "u-current",
      name: args.authorName?.trim() || "You",
      headline: "Community member",
    },
  };
  ensureSeeded(perfumeId);
  LOCAL_REVIEW_STORE.set(perfumeId, [localReview, ...(LOCAL_REVIEW_STORE.get(perfumeId) ?? [])]);
  return localReview;
}
