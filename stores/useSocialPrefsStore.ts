import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  fetchSocialPrefsBundle,
  removeRemoteBlockedUser,
  resetRemoteSocialPrefs,
  setRemotePostState,
  upsertRemoteBlockedUser,
  upsertSocialPreferencePatch,
} from "@/services/social-prefs";
import { isSupabaseConfigured } from "@/services/supabase";

export interface BlockedUser {
  id: string;
  name: string;
  handle: string;
}

interface SocialPrefsState {
  isHydrated: boolean;
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
  blockedUsers: BlockedUser[];
  setBoolean: (
    key:
      | "isPrivateProfile"
      | "hideCollectionFromPublic"
      | "allowComments"
      | "allowMentions"
      | "showActivityStatus"
      | "pushSocial"
      | "pushReminders"
      | "pushWishlist"
      | "pushPriceDrop",
    value: boolean,
  ) => void;
  toggleSavedPost: (postId: string) => void;
  toggleArchivedPost: (postId: string) => void;
  removeSavedPost: (postId: string) => void;
  removeArchivedPost: (postId: string) => void;
  unblockUser: (userId: string) => void;
  blockUser: (user: BlockedUser) => void;
  resetSocialPrefs: () => void;
  bootstrap: () => Promise<void>;
  clear: () => void;
}

const DEFAULT_BLOCKED_USERS: BlockedUser[] = [
  { id: "b-1", name: "Ceren M.", handle: "@cerenscent" },
  { id: "b-2", name: "Ali K.", handle: "@ali.layering" },
];

const DEFAULT_STATE = {
  isPrivateProfile: false,
  hideCollectionFromPublic: false,
  allowComments: true,
  allowMentions: true,
  showActivityStatus: true,
  pushSocial: true,
  pushReminders: true,
  pushWishlist: true,
  pushPriceDrop: true,
  savedPostIds: [] as string[],
  archivedPostIds: [] as string[],
  blockedUsers: DEFAULT_BLOCKED_USERS,
};

export const useSocialPrefsStore = create<SocialPrefsState>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      ...DEFAULT_STATE,
      setBoolean: (key, value) => {
        set({ [key]: value } as Pick<SocialPrefsState, typeof key>);
        void upsertSocialPreferencePatch({
          isPrivateProfile: key === "isPrivateProfile" ? value : undefined,
          hideCollectionFromPublic: key === "hideCollectionFromPublic" ? value : undefined,
          allowComments: key === "allowComments" ? value : undefined,
          allowMentions: key === "allowMentions" ? value : undefined,
          showActivityStatus: key === "showActivityStatus" ? value : undefined,
          pushSocial: key === "pushSocial" ? value : undefined,
          pushReminders: key === "pushReminders" ? value : undefined,
          pushWishlist: key === "pushWishlist" ? value : undefined,
          pushPriceDrop: key === "pushPriceDrop" ? value : undefined,
        }).catch(() => undefined);
      },
      toggleSavedPost: (postId) =>
        set((state) => {
          const hasPost = state.savedPostIds.includes(postId);
          const nextEnabled = !hasPost;
          void setRemotePostState({
            postId,
            state: "saved",
            enabled: nextEnabled,
          }).catch(() => undefined);
          return {
            savedPostIds: hasPost
              ? state.savedPostIds.filter((id) => id !== postId)
              : [postId, ...state.savedPostIds],
          };
        }),
      toggleArchivedPost: (postId) =>
        set((state) => {
          const hasPost = state.archivedPostIds.includes(postId);
          const nextEnabled = !hasPost;
          void setRemotePostState({
            postId,
            state: "archived",
            enabled: nextEnabled,
          }).catch(() => undefined);
          return {
            archivedPostIds: hasPost
              ? state.archivedPostIds.filter((id) => id !== postId)
              : [postId, ...state.archivedPostIds],
          };
        }),
      removeSavedPost: (postId) => {
        set((state) => ({
          savedPostIds: state.savedPostIds.filter((id) => id !== postId),
        }));
        void setRemotePostState({
          postId,
          state: "saved",
          enabled: false,
        }).catch(() => undefined);
      },
      removeArchivedPost: (postId) => {
        set((state) => ({
          archivedPostIds: state.archivedPostIds.filter((id) => id !== postId),
        }));
        void setRemotePostState({
          postId,
          state: "archived",
          enabled: false,
        }).catch(() => undefined);
      },
      unblockUser: (userId) => {
        const targetUser = get().blockedUsers.find((user) => user.id === userId);
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((user) => user.id !== userId),
        }));
        void removeRemoteBlockedUser({
          id: targetUser?.id,
          handle: targetUser?.handle,
        }).catch(() => undefined);
      },
      blockUser: (user) =>
        set((state) => {
          if (state.blockedUsers.some((entry) => entry.id === user.id)) return state;
          void upsertRemoteBlockedUser({
            name: user.name,
            handle: user.handle,
          }).catch(() => undefined);
          return { blockedUsers: [user, ...state.blockedUsers] };
        }),
      resetSocialPrefs: () => {
        set({
          ...DEFAULT_STATE,
          blockedUsers: [...DEFAULT_BLOCKED_USERS],
          isHydrated: true,
        });
        void resetRemoteSocialPrefs().catch(() => undefined);
      },
      bootstrap: async () => {
        set({ isHydrated: false });
        if (!isSupabaseConfigured) {
          set({ isHydrated: true });
          return;
        }
        try {
          const payload = await fetchSocialPrefsBundle();
          if (!payload) {
            set({ isHydrated: true });
            return;
          }
          set({
            ...payload,
            blockedUsers: payload.blockedUsers.length > 0 ? payload.blockedUsers : [...DEFAULT_BLOCKED_USERS],
            isHydrated: true,
          });
        } catch {
          set({ isHydrated: true });
        }
      },
      clear: () =>
        set({
          ...DEFAULT_STATE,
          blockedUsers: [...DEFAULT_BLOCKED_USERS],
          isHydrated: true,
        }),
    }),
    {
      name: "scentify-social-prefs",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isPrivateProfile: state.isPrivateProfile,
        hideCollectionFromPublic: state.hideCollectionFromPublic,
        allowComments: state.allowComments,
        allowMentions: state.allowMentions,
        showActivityStatus: state.showActivityStatus,
        pushSocial: state.pushSocial,
        pushReminders: state.pushReminders,
        pushWishlist: state.pushWishlist,
        pushPriceDrop: state.pushPriceDrop,
        savedPostIds: state.savedPostIds,
        archivedPostIds: state.archivedPostIds,
        blockedUsers: state.blockedUsers,
      }),
    },
  ),
);

export function getSocialPrefsSnapshot() {
  return useSocialPrefsStore.getState();
}
