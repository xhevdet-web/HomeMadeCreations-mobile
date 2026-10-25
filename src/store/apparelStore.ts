import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApparelPlacement, ApparelText, DesignSide, PrintArea } from '@/api/builderModels';
import { clampPlacement } from '@/helper/apparel';
import { uniqueId } from '@/helper/design';
import type { SavedProduct } from '@/api/commerceModels';
import { storage } from './storage';

interface ApparelDraft {
  categoryId: string | null;
  /** The company product the design is printed on, e.g. "Black Essential Hoodie". */
  baseProductId: string | null;
  /** One of the base product's sizes, e.g. "L". */
  size: string | null;
  name: string;
  placements: ApparelPlacement[];
  /** Personalised text, each printed on one side; x/y are within that side's print area. */
  texts: ApparelText[];
}

interface Snapshot { placements: ApparelPlacement[]; texts: ApparelText[] }

/** Last saved Product for this exact design, so an unchanged design isn't uploaded twice. */
interface SavedApparel { userId: string; signature: string; product: SavedProduct }

interface ApparelState extends ApparelDraft {
  side: DesignSide;
  /** A placed design or a text id. */
  selectedId: string | null;
  history: Snapshot[];
  historyIndex: number;
  saved: SavedApparel | null;
  markSaved: (saved: SavedApparel | null) => void;
  start: (categoryId: string, name: string) => void;
  load: (draft: Omit<ApparelDraft, 'texts'> & { texts?: ApparelText[] }) => void;
  rename: (name: string) => void;
  /** Picking another base keeps placements (they are print-area relative). */
  setBase: (baseProductId: string) => void;
  setSize: (size: string | null) => void;
  setSide: (side: DesignSide) => void;
  select: (id: string | null) => void;
  /** Adds a design to the current side, centred or at `at`, kept inside `area`. */
  add: (subCategoryId: string, area: PrintArea, at?: { x: number; y: number }, imageUri?: string) => string;
  /** Moves/resizes/rotates a design; the result is clamped to `area`. */
  update: (id: string, patch: Partial<Pick<ApparelPlacement, 'x' | 'y' | 'scale' | 'rotation'>>,
    area: PrintArea) => void;
  /** Adds text to the current side. */
  addText: (text: string, at: Omit<ApparelText, 'id' | 'text' | 'side'>) => string;
  /** `record: false` updates live (typing) without an undo step per keystroke. */
  updateText: (id: string, patch: Partial<Omit<ApparelText, 'id' | 'side'>>, record?: boolean) => void;
  /** Removes a design or a text. */
  remove: (id: string) => void;
  clearSide: () => void;
  undo: () => void;
  redo: () => void;
}

const empty: ApparelDraft = {
  categoryId: null, baseProductId: null, size: null, name: '', placements: [], texts: [],
};
const fresh = { side: 'FRONT' as DesignSide, selectedId: null, history: [{ placements: [], texts: [] }], historyIndex: 0 };

export const useApparelStore = create<ApparelState>()(
  persist(
    (set, get) => {
      const commit = (next: Partial<Snapshot>) => {
        const { history, historyIndex, selectedId, placements, texts } = get();
        const snapshot = { placements: next.placements ?? placements, texts: next.texts ?? texts };
        const trimmed = [...history.slice(0, historyIndex + 1), snapshot].slice(-60);
        const exists = snapshot.placements.some((item) => item.id === selectedId)
          || snapshot.texts.some((item) => item.id === selectedId);
        set({ ...snapshot, history: trimmed, historyIndex: trimmed.length - 1, selectedId: exists ? selectedId : null });
      };
      return {
        ...empty,
        ...fresh,
        saved: null,
        markSaved: (saved) => set({ saved }),
        start: (categoryId, name) => set({ ...empty, categoryId, name, ...fresh }),
        load: (draft) => {
          const texts = draft.texts ?? [];
          set({ ...draft, texts, ...fresh, history: [{ placements: draft.placements, texts }] });
        },
        rename: (name) => set({ name }),
        setBase: (baseProductId) => set((state) =>
          state.baseProductId === baseProductId ? {} : { baseProductId, size: null }),
        setSize: (size) => set({ size }),
        setSide: (side) => set({ side, selectedId: null }),
        select: (selectedId) => set({ selectedId }),
        add: (subCategoryId, area, at, imageUri) => {
          const id = uniqueId();
          // Cascade new designs slightly so repeated taps don't stack exactly.
          const onSide = get().placements.filter((item) => item.side === get().side).length;
          const nudge = (onSide % 4) * 0.06;
          const position = clampPlacement(
            { x: at?.x ?? 0.5 + nudge, y: at?.y ?? 0.5 + nudge, scale: 1, rotation: 0 }, area);
          commit({ placements: [...get().placements, {
            id, subCategoryId, side: get().side, rotation: 0, ...position, ...(imageUri ? { imageUri } : {}),
          }] });
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
          commit({ placements });
        },
        addText: (text, at) => {
          const id = uniqueId();
          commit({ texts: [...get().texts, { id, text, side: get().side, ...at }] });
          set({ selectedId: id });
          return id;
        },
        updateText: (id, patch, record = true) => {
          const texts = get().texts.map((item) => (item.id === id ? { ...item, ...defined(patch) } : item));
          if (record) commit({ texts });
          else set({ texts });
        },
        remove: (id) => commit({
          placements: get().placements.filter((item) => item.id !== id),
          texts: get().texts.filter((item) => item.id !== id),
        }),
        clearSide: () => commit({
          placements: get().placements.filter((item) => item.side !== get().side),
          texts: get().texts.filter((item) => item.side !== get().side),
        }),
        undo: () => {
          const index = get().historyIndex - 1;
          if (index >= 0) set({ ...get().history[index], historyIndex: index, selectedId: null });
        },
        redo: () => {
          const index = get().historyIndex + 1;
          if (index < get().history.length) set({ ...get().history[index], historyIndex: index, selectedId: null });
        },
      };
    },
    {
      // v2: drafts reference a base product and size (v1 drafts referenced garments).
      name: 'homemade-apparel-draft-v2',
      storage,
      partialize: ({ categoryId, baseProductId, size, name, placements, texts, saved }) =>
        ({ categoryId, baseProductId, size, name, placements, texts, saved }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Drafts saved before text existed have none.
          const texts = state.texts ?? [];
          useApparelStore.setState({ texts, history: [{ placements: state.placements, texts }], historyIndex: 0 });
        }
      },
    },
  ),
);

function defined<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<T>;
}
