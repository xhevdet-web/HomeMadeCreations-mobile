import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApparelPlacement, DesignSide, PrintArea, SelectedOptions } from '@/api/builderModels';
import { clampPlacement } from '@/helper/apparel';
import { uniqueId } from '@/helper/design';
import type { SavedProduct } from '@/api/commerceModels';
import { storage } from './storage';

interface ApparelDraft {
  categoryId: string | null;
  /** The garment model and its size × colour variant the design is printed on. */
  garmentId: string | null;
  variantId: string | null;
  name: string;
  selectedOptions: SelectedOptions;
  placements: ApparelPlacement[];
}

/** Last saved Product for this exact design, so an unchanged design isn't uploaded twice. */
interface SavedApparel { userId: string; signature: string; product: SavedProduct }

interface ApparelState extends ApparelDraft {
  side: DesignSide;
  selectedId: string | null;
  history: ApparelPlacement[][];
  historyIndex: number;
  saved: SavedApparel | null;
  markSaved: (saved: SavedApparel | null) => void;
  start: (categoryId: string, name: string) => void;
  load: (draft: ApparelDraft) => void;
  rename: (name: string) => void;
  /** Picking another garment keeps placements (they are print-area relative). */
  setGarment: (garmentId: string) => void;
  setVariant: (variantId: string | null) => void;
  setOption: (key: string, value: string | number | undefined) => void;
  setSide: (side: DesignSide) => void;
  select: (id: string | null) => void;
  /** Adds a design to the current side, centred or at `at`, kept inside `area`. */
  add: (subCategoryId: string, area: PrintArea, at?: { x: number; y: number }, imageUri?: string) => string;
  /** Moves/resizes/rotates a design; the result is clamped to `area`. */
  update: (id: string, patch: Partial<Pick<ApparelPlacement, 'x' | 'y' | 'scale' | 'rotation'>>,
    area: PrintArea) => void;
  remove: (id: string) => void;
  clearSide: () => void;
  undo: () => void;
  redo: () => void;
}

const empty: ApparelDraft = {
  categoryId: null, garmentId: null, variantId: null, name: '', selectedOptions: {}, placements: [],
};

export const useApparelStore = create<ApparelState>()(
  persist(
    (set, get) => {
      const commit = (placements: ApparelPlacement[]) => {
        const { history, historyIndex, selectedId } = get();
        const next = [...history.slice(0, historyIndex + 1), placements].slice(-60);
        set({
          placements,
          history: next,
          historyIndex: next.length - 1,
          selectedId: placements.some((item) => item.id === selectedId) ? selectedId : null,
        });
      };
      return {
        ...empty,
        side: 'FRONT',
        selectedId: null,
        history: [[]],
        historyIndex: 0,
        saved: null,
        markSaved: (saved) => set({ saved }),
        start: (categoryId, name) => set({
          ...empty, categoryId, name, side: 'FRONT', selectedId: null, history: [[]], historyIndex: 0,
        }),
        load: (draft) => set({
          ...draft, side: 'FRONT', selectedId: null, history: [draft.placements], historyIndex: 0,
        }),
        rename: (name) => set({ name }),
        setGarment: (garmentId) => set((state) =>
          state.garmentId === garmentId ? {} : { garmentId, variantId: null }),
        setVariant: (variantId) => set({ variantId }),
        setOption: (key, value) => set((state) => {
          const selectedOptions = { ...state.selectedOptions };
          if (value === undefined || value === '') delete selectedOptions[key];
          else selectedOptions[key] = value;
          return { selectedOptions };
        }),
        setSide: (side) => set({ side, selectedId: null }),
        select: (selectedId) => set({ selectedId }),
        add: (subCategoryId, area, at, imageUri) => {
          const id = uniqueId();
          // Cascade new designs slightly so repeated taps don't stack exactly.
          const onSide = get().placements.filter((item) => item.side === get().side).length;
          const nudge = (onSide % 4) * 0.06;
          const position = clampPlacement(
            { x: at?.x ?? 0.5 + nudge, y: at?.y ?? 0.5 + nudge, scale: 1, rotation: 0 }, area);
          commit([...get().placements, {
            id, subCategoryId, side: get().side, rotation: 0, ...position, ...(imageUri ? { imageUri } : {}),
          }]);
          set({ selectedId: id });
          return id;
        },
        update: (id, patch, area) => {
          const placements = get().placements.map((item) => {
            if (item.id !== id) return item;
            const changes = Object.fromEntries(
              Object.entries(patch).filter(([, value]) => value !== undefined));
            const next = { ...item, ...changes };
            return { ...next, ...clampPlacement(next, area) };
          });
          commit(placements);
        },
        remove: (id) => commit(get().placements.filter((item) => item.id !== id)),
        clearSide: () => commit(get().placements.filter((item) => item.side !== get().side)),
        undo: () => {
          const index = get().historyIndex - 1;
          if (index >= 0) set({ placements: get().history[index], historyIndex: index, selectedId: null });
        },
        redo: () => {
          const index = get().historyIndex + 1;
          if (index < get().history.length)
            set({ placements: get().history[index], historyIndex: index, selectedId: null });
        },
      };
    },
    {
      name: 'homemade-apparel-draft-v1',
      storage,
      partialize: ({ categoryId, garmentId, variantId, name, selectedOptions, placements, saved }) =>
        ({ categoryId, garmentId, variantId, name, selectedOptions, placements, saved }),
      onRehydrateStorage: () => (state) => {
        if (state) useApparelStore.setState({ history: [state.placements], historyIndex: 0 });
      },
    },
  ),
);
