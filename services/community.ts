import { isSupabaseConfigured, requireSupabase } from "@/services/supabase";
import { mockPerfumes } from "@/services/mock-data";
import { pushInAppNotification } from "@/services/notifications";
import { DEMO_USER_ID, useAuthStore } from "@/stores/useAuthStore";

const COMMUNITY_MEDIA_BUCKET = "community-media";

export type CommunityPostType =
  | "fotd"
  | "new_bottle"
  | "review"
  | "question"
  | "layering"
  | "comparison"
  | "worth_it"
  | "sotd";
export type CommunityVisibility = "public" | "friends" | "followers" | "private";

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  perfumeId?: string;
  perfumeName?: string;
  perfumeBrand?: string;
  perfumeImageUrl?: string;
  mediaUrl?: string;
  caption: string;
  visibility: CommunityVisibility;
  authorName: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

type CommunityPostRow = {
  id: string;
  user_id: string;
  type: CommunityPostType;
  perfume_id: string | null;
  media_url: string | null;
  caption: string;
  visibility: CommunityVisibility;
  like_count: number;
  comment_count: number;
  created_at: string;
  perfume: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
  } | Array<{
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
  }> | null;
};

type CommunityCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
};

type PublicProfileRow = {
  user_id: string;
  display_name: string | null;
};

function isDemoSession() {
  return useAuthStore.getState().session?.user?.id === DEMO_USER_ID;
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - 1000 * 60 * minutes).toISOString();
}

function seedPost(args: {
  id: string;
  type: CommunityPostType;
  perfumeIndex?: number;
  caption: string;
  authorName: string;
  minutes: number;
  likeCount: number;
  commentCount: number;
  media?: boolean;
}): CommunityPost {
  const perfume = typeof args.perfumeIndex === "number" ? mockPerfumes[args.perfumeIndex] : undefined;
  return {
    id: args.id,
    type: args.type,
    perfumeId: perfume?.id,
    perfumeName: perfume?.name,
    perfumeBrand: perfume?.brand,
    perfumeImageUrl: perfume?.imageUrl,
    mediaUrl: args.media ? perfume?.imageUrl : undefined,
    caption: args.caption,
    visibility: "public",
    authorName: args.authorName,
    createdAt: minutesAgo(args.minutes),
    likeCount: args.likeCount,
    commentCount: args.commentCount,
  };
}

const seedPosts: CommunityPost[] = [
  seedPost({
    id: "p-1",
    type: "sotd",
    perfumeIndex: 0,
    authorName: "Deniz Kaya",
    minutes: 18,
    likeCount: 86,
    commentCount: 9,
    media: true,
    caption: "Bugünün ofis kokusu: temiz, kontrollü ve sabah kahvesiyle çok iyi oturdu. 4 saat sonra hâlâ yakın mesafede net hissediliyor.",
  }),
  seedPost({
    id: "p-2",
    type: "layering",
    perfumeIndex: 3,
    authorName: "Sena Arman",
    minutes: 44,
    likeCount: 64,
    commentCount: 12,
    media: true,
    caption: "Wood Sage & Sea Salt üstüne tek fıs vanilyalı bir baz denedim. Deniz tuzu tarafını yumuşatıyor, yaz akşamı gibi oldu.",
  }),
  seedPost({
    id: "p-3",
    type: "question",
    authorName: "Ege Tan",
    minutes: 73,
    likeCount: 31,
    commentCount: 18,
    caption: "İstanbul'da yağmurlu havada boğmadan çalışan, temiz ama karakterli bir günlük koku arıyorum. Sizce citrus mu musky mi daha iyi gider?",
  }),
  seedPost({
    id: "p-4",
    type: "review",
    perfumeIndex: 2,
    authorName: "Mert Can",
    minutes: 132,
    likeCount: 119,
    commentCount: 22,
    media: true,
    caption: "Grand Soir ilk 20 dakikada yoğun ama sonrasında amber tabanı çok rafine kalıyor. Akşam yemeği ve özel gün için fazlasıyla güçlü.",
  }),
  seedPost({
    id: "p-5",
    type: "comparison",
    perfumeIndex: 1,
    authorName: "Lara K.",
    minutes: 188,
    likeCount: 52,
    commentCount: 15,
    caption: "Another 13 mü yoksa Gentle Fluidity Silver mı? İkisi de temiz ama biri ten kokusu gibi, diğeri daha parlak ve metalik geliyor.",
  }),
  seedPost({
    id: "p-6",
    type: "new_bottle",
    perfumeIndex: 6,
    authorName: "Bora Selim",
    minutes: 241,
    likeCount: 73,
    commentCount: 8,
    media: true,
    caption: "Koleksiyona yeni şişe eklendi. İlk izlenim: açılış enerjik, drydown daha kremamsı. Tam bahar rotasyonu kokusu.",
  }),
  seedPost({
    id: "p-7",
    type: "worth_it",
    perfumeIndex: 4,
    authorName: "Mina Öz",
    minutes: 320,
    likeCount: 45,
    commentCount: 11,
    caption: "Gentle Fluidity Silver fiyatına değer mi? Performans iyi ama asıl olayı imza hissi. Minimal giyinen birine çok yakışır.",
  }),
  seedPost({
    id: "p-8",
    type: "fotd",
    perfumeIndex: 5,
    authorName: "Kerem Altuğ",
    minutes: 390,
    likeCount: 38,
    commentCount: 6,
    media: true,
    caption: "Bugün gri blazer + beyaz tişört kombiniyle Gris Dior. Pudramsı tarafı kıyafete çok iyi bağlandı.",
  }),
  seedPost({
    id: "p-9",
    type: "sotd",
    perfumeIndex: 7,
    authorName: "Ceren M.",
    minutes: 470,
    likeCount: 91,
    commentCount: 14,
    media: true,
    caption: "Bal d'Afrique güneşli havada daha canlı açılıyor. Limon, vetiver ve hafif tatlılık dengesi bugün tam yerinde.",
  }),
  seedPost({
    id: "p-10",
    type: "question",
    authorName: "Duru Şahin",
    minutes: 545,
    likeCount: 27,
    commentCount: 19,
    caption: "Kokuyu kıyafete mi tene mi sıkıyorsunuz? Bazı fresh kokular tende daha çabuk uçuyor gibi hissediyorum.",
  }),
  seedPost({
    id: "p-11",
    type: "review",
    perfumeIndex: 8,
    authorName: "Onur V.",
    minutes: 690,
    likeCount: 66,
    commentCount: 10,
    media: true,
    caption: "Dumanlı kokular içinde en giyilebilir bulduğum profil bu oldu. Kışlık ama kapalı ortamda iki fıs yeterli.",
  }),
  seedPost({
    id: "p-12",
    type: "layering",
    perfumeIndex: 9,
    authorName: "Yağmur N.",
    minutes: 820,
    likeCount: 58,
    commentCount: 7,
    caption: "Temiz misk + hafif çiçeksi bir koku birlikte çok daha yumuşak bir imza bırakıyor. Fazla tatlı olmayan kombin önerisi olan var mı?",
  }),
];

const seedComments: CommunityComment[] = [
  { id: "c-1", postId: "p-1", authorName: "Bora", body: "Ofis için çok mantıklı seçim olmuş.", createdAt: minutesAgo(14) },
  { id: "c-2", postId: "p-1", authorName: "Deniz Kaya", parentId: "c-1", body: "Kesinlikle, yayılımı da kontrollü.", createdAt: minutesAgo(11) },
  { id: "c-3", postId: "p-1", authorName: "Mina", body: "Bleu EDP bende de en risksiz toplantı kokusu.", createdAt: minutesAgo(9) },
  { id: "c-4", postId: "p-2", authorName: "Lara K.", body: "Bu layering'i akşam deneyeceğim, tuzlu tarafı yumuşatma fikri iyi.", createdAt: minutesAgo(28) },
  { id: "c-5", postId: "p-2", authorName: "Sena Arman", body: "Tek fıs yeterli, yoksa vanilya öne geçiyor.", createdAt: minutesAgo(24) },
  { id: "c-6", postId: "p-3", authorName: "Kerem", body: "Yağmurda musky daha güzel kalıyor bence, citrus çabuk dağılıyor.", createdAt: minutesAgo(63) },
  { id: "c-7", postId: "p-3", authorName: "Ceren M.", body: "Temiz musk + hafif woody güzel olur.", createdAt: minutesAgo(51) },
  { id: "c-8", postId: "p-4", authorName: "Sena", body: "Kış akşamlarında inanılmaz iyi çalışıyor.", createdAt: minutesAgo(104) },
  { id: "c-9", postId: "p-4", authorName: "Ege", body: "İki fıs bile fazla gelebiliyor ama drydown şahane.", createdAt: minutesAgo(89) },
  { id: "c-10", postId: "p-5", authorName: "Duru", body: "Another 13 daha kişisel, GFS daha fark edilir.", createdAt: minutesAgo(150) },
  { id: "c-11", postId: "p-6", authorName: "Mert Can", body: "Şişe çok iyi duruyor, performans nasıl?", createdAt: minutesAgo(208) },
  { id: "c-12", postId: "p-7", authorName: "Onur V.", body: "Bence ofis imzası arayan için değer.", createdAt: minutesAgo(286) },
  { id: "c-13", postId: "p-8", authorName: "Yağmur", body: "Gris Dior gerçekten kıyafetle çok iyi eşleşiyor.", createdAt: minutesAgo(350) },
  { id: "c-14", postId: "p-9", authorName: "Lara K.", body: "Bal d'Afrique yazın bambaşka açılıyor.", createdAt: minutesAgo(420) },
  { id: "c-15", postId: "p-10", authorName: "Bora", body: "Fresh kokularda kıyafete bir fıs ekliyorum.", createdAt: minutesAgo(500) },
  { id: "c-16", postId: "p-11", authorName: "Mina Öz", body: "Dumanlı profilde kontrollü doz gerçekten önemli.", createdAt: minutesAgo(620) },
  { id: "c-17", postId: "p-12", authorName: "Ceren M.", body: "Clean Reserve Skin tarzı kokularla iyi eşleşir.", createdAt: minutesAgo(770) },
];

let postsStore: CommunityPost[] = [...seedPosts];
let commentsStore: CommunityComment[] = [...seedComments];

function sortByDateDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function withCommentCount(post: CommunityPost): CommunityPost {
  const count = commentsStore.filter((comment) => comment.postId === post.id).length;
  return { ...post, commentCount: Math.max(post.commentCount, count) };
}

async function getAuthUserId() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error("No authenticated user found.");
  return data.user.id;
}

async function getAuthUserIdOptional() {
  try {
    const { data } = await requireSupabase().auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchProfilesMap(userIds: string[]) {
  if (!isSupabaseConfigured || userIds.length === 0) return new Map<string, string>();

  const { data } = await requireSupabase()
    .from("user_public_profiles")
    .select("user_id,display_name")
    .in("user_id", userIds);

  const map = new Map<string, string>();
  (data as PublicProfileRow[] | null)?.forEach((row) => {
    map.set(row.user_id, row.display_name?.trim() || "Scentify User");
  });
  return map;
}

function mapPostRowToPost(row: CommunityPostRow, authorName: string): CommunityPost {
  const perfume = Array.isArray(row.perfume) ? row.perfume[0] : row.perfume;
  return {
    id: row.id,
    type: row.type,
    perfumeId: row.perfume_id ?? undefined,
    perfumeName: perfume?.name ?? undefined,
    perfumeBrand: perfume?.brand ?? undefined,
    perfumeImageUrl: perfume?.image_url ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    caption: row.caption,
    visibility: row.visibility,
    authorName,
    createdAt: row.created_at,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
  };
}

function extractImageExtension(uri: string) {
  const cleanUri = uri.split("?")[0] ?? uri;
  const matched = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  const normalized = (matched?.[1] ?? "jpg").toLowerCase();
  if (normalized === "jpeg" || normalized === "jpg") return "jpg";
  if (normalized === "png") return "png";
  if (normalized === "webp") return "webp";
  if (normalized === "heic") return "heic";
  return "jpg";
}

function mimeTypeForExtension(ext: string) {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "image/jpeg";
}

async function uploadCommunityMedia(args: { userId: string; localUri: string }) {
  const fileUri = args.localUri.trim();
  if (!fileUri) throw new Error("Media URI is empty.");

  const ext = extractImageExtension(fileUri);
  const objectPath = `${args.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const fileResponse = await fetch(fileUri);
  if (!fileResponse.ok) {
    throw new Error("Could not read local media file.");
  }

  const fileBlob = await fileResponse.blob();
  const contentType = fileBlob.type || mimeTypeForExtension(ext);

  const { error: uploadError } = await requireSupabase()
    .storage
    .from(COMMUNITY_MEDIA_BUCKET)
    .upload(objectPath, fileBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = requireSupabase()
    .storage
    .from(COMMUNITY_MEDIA_BUCKET)
    .getPublicUrl(objectPath);

  if (!publicData?.publicUrl) {
    throw new Error("Could not build public URL for media.");
  }

  return publicData.publicUrl;
}

export async function listCommunityPosts(limit = 20) {
  if (isDemoSession()) {
    return sortByDateDesc(postsStore).map(withCommentCount).slice(0, limit);
  }

  if (isSupabaseConfigured) {
    try {
      const viewerId = await getAuthUserIdOptional();
      const { data, error } = await requireSupabase()
        .from("community_posts")
        .select(`
          id,
          user_id,
          type,
          perfume_id,
          media_url,
          caption,
          visibility,
          like_count,
          comment_count,
          created_at,
          perfume:perfumes (
            id,
            name,
            brand,
            image_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const rows = (data ?? []) as CommunityPostRow[];
      const visibleRows = rows.filter((row) => row.visibility === "public" || row.user_id === viewerId);
      const profiles = await fetchProfilesMap([...new Set(visibleRows.map((row) => row.user_id))]);
      return visibleRows.map((row) => mapPostRowToPost(row, profiles.get(row.user_id) ?? "Scentify User"));
    } catch {
      // fall through to local fallback
    }
  }

  return sortByDateDesc(postsStore).map(withCommentCount).slice(0, limit);
}

export async function getCommunityPostById(id: string) {
  const localPost = postsStore.find((post) => post.id === id);

  if (isDemoSession()) {
    return localPost ? withCommentCount(localPost) : null;
  }

  if (isSupabaseConfigured) {
    try {
      const viewerId = await getAuthUserIdOptional();
      const { data, error } = await requireSupabase()
        .from("community_posts")
        .select(`
          id,
          user_id,
          type,
          perfume_id,
          media_url,
          caption,
          visibility,
          like_count,
          comment_count,
          created_at,
          perfume:perfumes (
            id,
            name,
            brand,
            image_url
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return localPost ? withCommentCount(localPost) : null;
      }
      const row = data as CommunityPostRow;
      if (row.visibility !== "public" && row.user_id !== viewerId) {
        return localPost ? withCommentCount(localPost) : null;
      }
      const profiles = await fetchProfilesMap([row.user_id]);
      return mapPostRowToPost(row, profiles.get(row.user_id) ?? "Scentify User");
    } catch {
      // fall through to local fallback
    }
  }

  return localPost ? withCommentCount(localPost) : null;
}

export async function listPostComments(postId: string) {
  if (isDemoSession()) {
    return sortByDateDesc(commentsStore.filter((comment) => comment.postId === postId));
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await requireSupabase()
        .from("community_comments")
        .select("id,post_id,user_id,parent_id,body,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const rows = (data ?? []) as CommunityCommentRow[];
      const profiles = await fetchProfilesMap([...new Set(rows.map((row) => row.user_id))]);
      const remoteComments = rows.map((row) => ({
        id: row.id,
        postId: row.post_id,
        parentId: row.parent_id ?? undefined,
        authorName: profiles.get(row.user_id) ?? "Scentify User",
        body: row.body,
        createdAt: row.created_at,
      })) satisfies CommunityComment[];

      if (remoteComments.length > 0) {
        return remoteComments;
      }
    } catch {
      // fall through to local fallback
    }
  }

  return sortByDateDesc(commentsStore.filter((comment) => comment.postId === postId));
}

export async function createCommunityPost(args: {
  type: CommunityPostType;
  perfumeId?: string;
  mediaUri?: string;
  caption: string;
  visibility: CommunityVisibility;
  authorName: string;
}) {
  const caption = args.caption.trim();
  if (!caption) throw new Error("Caption is required.");

  if (!isDemoSession() && isSupabaseConfigured) {
    try {
      const userId = await getAuthUserId();
      const mediaUrl = args.mediaUri?.trim()
        ? await uploadCommunityMedia({ userId, localUri: args.mediaUri.trim() })
        : null;
      const { data, error } = await requireSupabase()
        .from("community_posts")
        .insert({
          user_id: userId,
          type: args.type,
          perfume_id: args.perfumeId ?? null,
          media_url: mediaUrl,
          caption,
          visibility: args.visibility,
        })
        .select(`
          id,
          user_id,
          type,
          perfume_id,
          media_url,
          caption,
          visibility,
          like_count,
          comment_count,
          created_at,
          perfume:perfumes (
            id,
            name,
            brand,
            image_url
          )
        `)
        .single();

      if (error) throw error;
      const row = data as CommunityPostRow;
      const profiles = await fetchProfilesMap([userId]);
      return mapPostRowToPost(row, profiles.get(userId) ?? (args.authorName || "You"));
    } catch {
      // fallback below
    }
  }

  const perfume = args.perfumeId ? mockPerfumes.find((item) => item.id === args.perfumeId) : undefined;
  const post: CommunityPost = {
    id: `p-${Date.now()}`,
    type: args.type,
    perfumeId: perfume?.id,
    perfumeName: perfume?.name,
    perfumeBrand: perfume?.brand,
    perfumeImageUrl: perfume?.imageUrl,
    mediaUrl: args.mediaUri,
    caption,
    visibility: args.visibility,
    authorName: args.authorName.trim() || "You",
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };
  postsStore = [post, ...postsStore];
  return post;
}

export async function addPostComment(args: {
  postId: string;
  body: string;
  authorName: string;
  parentId?: string;
}) {
  const body = args.body.trim();
  if (!body) throw new Error("Comment body is required.");

  if (!isDemoSession() && isSupabaseConfigured) {
    try {
      const userId = await getAuthUserId();
      const { data: ownerData } = await requireSupabase()
        .from("community_posts")
        .select("id,user_id")
        .eq("id", args.postId)
        .maybeSingle();

      const { data, error } = await requireSupabase()
        .from("community_comments")
        .insert({
          post_id: args.postId,
          user_id: userId,
          parent_id: args.parentId ?? null,
          body,
        })
        .select("id,post_id,user_id,parent_id,body,created_at")
        .single();

      if (error) throw error;
      const profiles = await fetchProfilesMap([userId]);
      const row = data as CommunityCommentRow;
      const commenterName = profiles.get(userId) ?? (args.authorName || "You");

      if (ownerData && (ownerData as { user_id: string }).user_id !== userId) {
        await pushInAppNotification({
          type: "social",
          title: "Gönderine yeni yorum geldi",
          body: `${commenterName}: ${row.body.slice(0, 90)}`,
          route: `/post/${args.postId}`,
          exists: true,
        });
      }

      return {
        id: row.id,
        postId: row.post_id,
        parentId: row.parent_id ?? undefined,
        authorName: commenterName,
        body: row.body,
        createdAt: row.created_at,
      } satisfies CommunityComment;
    } catch {
      // fallback below
    }
  }

  const comment: CommunityComment = {
    id: `c-${Date.now()}`,
    postId: args.postId,
    parentId: args.parentId,
    authorName: args.authorName.trim() || "You",
    body,
    createdAt: new Date().toISOString(),
  };
  commentsStore = [comment, ...commentsStore];
  postsStore = postsStore.map((post) =>
    post.id === args.postId ? { ...post, commentCount: post.commentCount + 1 } : post,
  );
  const parentPost = postsStore.find((post) => post.id === args.postId);
  if (parentPost && parentPost.authorName !== comment.authorName) {
    await pushInAppNotification({
      type: "social",
      title: "Gönderine yeni yorum geldi",
      body: `${comment.authorName}: ${comment.body.slice(0, 90)}`,
      route: `/post/${args.postId}`,
      exists: true,
    });
  }
  return comment;
}

export function subscribeToCommunityFeed(onChange: () => void) {
  if (isDemoSession() || !isSupabaseConfigured) {
    return () => undefined;
  }

  const supabase = requireSupabase();
  const channel = supabase
    .channel(`community-feed-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_posts" },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_comments" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToPostThread(postId: string, onChange: () => void) {
  if (isDemoSession() || !isSupabaseConfigured || !postId.trim()) {
    return () => undefined;
  }

  const supabase = requireSupabase();
  const channel = supabase
    .channel(`community-post-${postId}-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_posts", filter: `id=eq.${postId}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_comments", filter: `post_id=eq.${postId}` },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
