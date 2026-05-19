import { create } from "zustand";

import { mockPerfumes } from "@/services/mock-data";
import { fetchMyCollection, upsertCollectionItem, upsertRating } from "@/services/user-data";
import { isSupabaseConfigured } from "@/services/supabase";
import type { CollectionItem, CollectionStatus } from "@/utils/types";

interface CollectionState {
  items: CollectionItem[];
  isHydrated: boolean;
  bootstrap: () => Promise<void>;
  clear: () => void;
  seedDemoItems: () => Promise<void>;
  addItem: (perfumeId: string, status: CollectionStatus) => Promise<void>;
  setRating: (perfumeId: string, rating: number) => Promise<void>;
  getByStatus: (status: CollectionStatus) => CollectionItem[];
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  items: [],
  isHydrated: false,
  bootstrap: async () => {
    set({ isHydrated: false });

    if (!isSupabaseConfigured) {
      set({ items: [], isHydrated: true });
      return;
    }

    try {
      const items = await fetchMyCollection();
      set({ items, isHydrated: true });
    } catch {
      set((state) => ({ items: state.items, isHydrated: true }));
    }
  },
  clear: () => set({ items: [], isHydrated: true }),
  seedDemoItems: async () => {
    const seeds = [
      { perfumeId: mockPerfumes[0]?.id, status: "owned" as CollectionStatus },
      { perfumeId: mockPerfumes[2]?.id, status: "wishlist" as CollectionStatus },
      { perfumeId: mockPerfumes[4]?.id, status: "sampled" as CollectionStatus },
    ].filter((entry) => !!entry.perfumeId) as Array<{ perfumeId: string; status: CollectionStatus }>;

    if (seeds.length === 0) return;

    if (isSupabaseConfigured) {
      try {
        for (const seed of seeds) {
          await upsertCollectionItem(seed.perfumeId, seed.status);
        }
        const items = await fetchMyCollection();
        set({ items });
        return;
      } catch {}
    }

    set((state) => {
      const existingById = new Map(state.items.map((item) => [item.perfume.id, item]));
      const nextItems = [...state.items];

      seeds.forEach((seed, index) => {
        const perfume = mockPerfumes.find((entry) => entry.id === seed.perfumeId);
        if (!perfume) return;

        const existing = existingById.get(perfume.id);
        if (existing) {
          const updated = { ...existing, status: seed.status };
          const idx = nextItems.findIndex((item) => item.perfume.id === perfume.id);
          if (idx >= 0) nextItems[idx] = updated;
          return;
        }

        nextItems.push({
          id: `demo-${perfume.id}-${index}`,
          perfume,
          status: seed.status,
        });
      });

      return { items: nextItems };
    });
  },
  addItem: async (perfumeId, status) => {
    if (isSupabaseConfigured) {
      try {
        await upsertCollectionItem(perfumeId, status);
        const items = await fetchMyCollection();
        set({ items });
        return;
      } catch {}
    }

    set((state) => {
      const perfume = mockPerfumes.find((entry) => entry.id === perfumeId || entry.slug === perfumeId);
      if (!perfume) return state;

      const existing = state.items.find((item) => item.perfume.id === perfume.id);
      if (existing) {
        return {
          items: state.items.map((item) => (item.perfume.id === perfume.id ? { ...item, status } : item)),
        };
      }

      return {
        items: [
          ...state.items,
          {
            id: `${perfumeId}-${status}`,
            perfume,
            status,
          },
        ],
      };
    });
  },
  setRating: async (perfumeId, rating) => {
    if (isSupabaseConfigured) {
      try {
        await upsertRating(perfumeId, rating);
        const items = await fetchMyCollection();
        set({ items });
        return;
      } catch {}
    }

    set((state) => {
      const perfume = mockPerfumes.find((entry) => entry.id === perfumeId || entry.slug === perfumeId);
      if (!perfume) return state;

      const existing = state.items.find((item) => item.perfume.id === perfume.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.perfume.id === perfume.id
              ? { ...item, rating, status: item.status === "wishlist" ? "sampled" : item.status }
              : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            id: `${perfume.id}-sampled`,
            perfume,
            status: "sampled",
            rating,
          },
        ],
      };
    });
  },
  getByStatus: (status) => get().items.filter((item) => item.status === status),
}));
