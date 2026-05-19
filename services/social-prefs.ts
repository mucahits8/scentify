import { isSupabaseConfigured, requireSupabase } from "@/services/supabase";

export type RemoteBlockedUser = {
  id: string;
  name: string;
  handle: string;
};

type SocialPrefsRow = {
  user_id: string;
  is_private_profile: boolean;
  hide_collection_from_public: boolean;
  allow_comments: boolean;
  allow_mentions: boolean;
  show_activity_status: boolean;
  push_social: boolean;
  push_reminders: boolean;
  push_wishlist: boolean;
  push_price_drop: boolean;
};

type PostStateRow = {
  post_id: string;
  state: "saved" | "archived";
};

type BlockedRow = {
  id: string;
  blocked_name: string;
  blocked_handle: string;
};

export type SocialPrefsPayload = {
  isPrivateProfile: boolean;
  hideCollectionFromPublic: boolean;
  allowComments: boolean;
  allowMentions: boolean;
  showActivityStatus: boolean;
  pushSocial: boolean;
  pushReminders: boolean;
  pushWishlist: boolean;
  pushPriceDrop: boolean;
  savedPostIds: string[];
  archivedPostIds: string[];
  blockedUsers: RemoteBlockedUser[];
};

async function getAuthUserId() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error("No authenticated user found.");
  return data.user.id;
}

function mapPrefsRow(row: SocialPrefsRow | null): Omit<SocialPrefsPayload, "savedPostIds" | "archivedPostIds" | "blockedUsers"> {
  if (!row) {
    return {
      isPrivateProfile: false,
      hideCollectionFromPublic: false,
      allowComments: true,
      allowMentions: true,
      showActivityStatus: true,
      pushSocial: true,
      pushReminders: true,
      pushWishlist: true,
      pushPriceDrop: true,
    };
  }

  return {
    isPrivateProfile: row.is_private_profile,
    hideCollectionFromPublic: row.hide_collection_from_public,
    allowComments: row.allow_comments,
    allowMentions: row.allow_mentions,
    showActivityStatus: row.show_activity_status,
    pushSocial: row.push_social,
    pushReminders: row.push_reminders,
    pushWishlist: row.push_wishlist,
    pushPriceDrop: row.push_price_drop,
  };
}

export async function fetchSocialPrefsBundle() {
  if (!isSupabaseConfigured) return null;

  const supabase = requireSupabase();
  const userId = await getAuthUserId();

  const [prefsRes, postStateRes, blockedRes] = await Promise.all([
    supabase
      .from("user_social_preferences")
      .select(
        "user_id,is_private_profile,hide_collection_from_public,allow_comments,allow_mentions,show_activity_status,push_social,push_reminders,push_wishlist,push_price_drop",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_post_states")
      .select("post_id,state")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_blocked_profiles")
      .select("id,blocked_name,blocked_handle")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (prefsRes.error) throw prefsRes.error;
  if (postStateRes.error) throw postStateRes.error;
  if (blockedRes.error) throw blockedRes.error;

  const prefs = mapPrefsRow((prefsRes.data as SocialPrefsRow | null) ?? null);
  const states = (postStateRes.data ?? []) as PostStateRow[];
  const blockedRows = (blockedRes.data ?? []) as BlockedRow[];

  return {
    ...prefs,
    savedPostIds: states.filter((row) => row.state === "saved").map((row) => row.post_id),
    archivedPostIds: states.filter((row) => row.state === "archived").map((row) => row.post_id),
    blockedUsers: blockedRows.map((row) => ({
      id: row.id,
      name: row.blocked_name,
      handle: row.blocked_handle,
    })),
  } satisfies SocialPrefsPayload;
}

export async function upsertSocialPreferencePatch(
  patch: Partial<{
    isPrivateProfile: boolean;
    hideCollectionFromPublic: boolean;
    allowComments: boolean;
    allowMentions: boolean;
    showActivityStatus: boolean;
    pushSocial: boolean;
    pushReminders: boolean;
    pushWishlist: boolean;
    pushPriceDrop: boolean;
  }>,
) {
  if (!isSupabaseConfigured) return;

  const userId = await getAuthUserId();
  const payload: Record<string, boolean | string> = { user_id: userId };

  if (typeof patch.isPrivateProfile === "boolean") payload.is_private_profile = patch.isPrivateProfile;
  if (typeof patch.hideCollectionFromPublic === "boolean") payload.hide_collection_from_public = patch.hideCollectionFromPublic;
  if (typeof patch.allowComments === "boolean") payload.allow_comments = patch.allowComments;
  if (typeof patch.allowMentions === "boolean") payload.allow_mentions = patch.allowMentions;
  if (typeof patch.showActivityStatus === "boolean") payload.show_activity_status = patch.showActivityStatus;
  if (typeof patch.pushSocial === "boolean") payload.push_social = patch.pushSocial;
  if (typeof patch.pushReminders === "boolean") payload.push_reminders = patch.pushReminders;
  if (typeof patch.pushWishlist === "boolean") payload.push_wishlist = patch.pushWishlist;
  if (typeof patch.pushPriceDrop === "boolean") payload.push_price_drop = patch.pushPriceDrop;

  const { error } = await requireSupabase()
    .from("user_social_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

export async function setRemotePostState(args: {
  postId: string;
  state: "saved" | "archived";
  enabled: boolean;
}) {
  if (!isSupabaseConfigured) return;
  const userId = await getAuthUserId();

  if (!args.postId.trim()) return;

  if (args.enabled) {
    const { error } = await requireSupabase()
      .from("user_post_states")
      .upsert(
        {
          user_id: userId,
          post_id: args.postId.trim(),
          state: args.state,
        },
        { onConflict: "user_id,post_id,state" },
      );

    if (error) throw error;
    return;
  }

  const { error } = await requireSupabase()
    .from("user_post_states")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", args.postId.trim())
    .eq("state", args.state);

  if (error) throw error;
}

export async function upsertRemoteBlockedUser(user: { name: string; handle: string }) {
  if (!isSupabaseConfigured) return;
  const userId = await getAuthUserId();

  const handle = user.handle.trim();
  if (!handle) return;

  const { error } = await requireSupabase()
    .from("user_blocked_profiles")
    .upsert(
      {
        user_id: userId,
        blocked_name: user.name.trim() || handle,
        blocked_handle: handle,
      },
      { onConflict: "user_id,blocked_handle" },
    );

  if (error) throw error;
}

export async function removeRemoteBlockedUser(args: { id?: string; handle?: string }) {
  if (!isSupabaseConfigured) return;
  const userId = await getAuthUserId();

  const query = requireSupabase().from("user_blocked_profiles").delete().eq("user_id", userId);
  if (args.id?.trim()) {
    const { error } = await query.eq("id", args.id.trim());
    if (error) throw error;
    return;
  }

  if (args.handle?.trim()) {
    const { error } = await query.eq("blocked_handle", args.handle.trim());
    if (error) throw error;
  }
}

export async function resetRemoteSocialPrefs() {
  if (!isSupabaseConfigured) return;
  const userId = await getAuthUserId();

  const [postStateRes, blockedRes, prefRes] = await Promise.all([
    requireSupabase()
      .from("user_post_states")
      .delete()
      .eq("user_id", userId),
    requireSupabase()
      .from("user_blocked_profiles")
      .delete()
      .eq("user_id", userId),
    requireSupabase()
      .from("user_social_preferences")
      .delete()
      .eq("user_id", userId),
  ]);

  if (postStateRes.error) throw postStateRes.error;
  if (blockedRes.error) throw blockedRes.error;
  if (prefRes.error) throw prefRes.error;
}
