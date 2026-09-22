import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Design } from '@/types/models';
import { uniqueId } from '@/helper/design';
import { storage } from './storage';
interface SavedState {
  designs: Design[];
  save: (design: Design) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
}
export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      designs: [],
      save: (design) =>
        set({ designs: [design, ...get().designs.filter((entry) => entry.id !== design.id)] }),
      remove: (id) => set({ designs: get().designs.filter((entry) => entry.id !== id) }),
      duplicate: (id) => {
        const source = get().designs.find((entry) => entry.id === id);
        if (source)
          get().save({
            ...source,
            id: uniqueId(),
            name: `${source.name} (copy)`,
            updatedAt: new Date().toISOString(),
          });
      },
    }),
    { name: 'homemade-saved-v1', storage },
  ),
);
