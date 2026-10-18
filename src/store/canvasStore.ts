import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasPlacement, TextLayer } from '@/api/builderModels';
import type { SavedProduct } from '@/api/commerceModels';
import type { CanvasBuilder, Transform } from '@/helper/canvasStudio';
import { uniqueId } from '@/helper/design';
import type { CategorySize } from '@/types/models';
import { storage } from './storage';

/** A bouquet or gift being composed: what is placed where, plus personalised text. */
export interface CanvasDraft {
  builderType: CanvasBuilder | null;
  categoryId: string | null;
  categoryName: string;
  size: CategorySize | null;
  name: string;
  placements: CanvasPlacement[];
  texts: TextLayer[];
}

interface Snapshot { placements: CanvasPlacement[]; texts: TextLayer[] }

/** Last saved Product for this exact design, so an unchanged design isn't uploaded twice. */
interface SavedCanvas { userId: string; signature: string; product: SavedProduct }

interface CanvasState extends CanvasDraft {
  /** A placement or text layer id. */
  selectedId: string | null;
  history: Snapshot[];
  historyIndex: number;
  saved: SavedCanvas | null;
  markSaved: (saved: SavedCanvas | null) => void;
  /** Opens a category; the same category and size keep the current composition. */
  start: (draft: Pick<CanvasDraft, 'builderType' | 'categoryId' | 'categoryName' | 'size'>) => void;
  load: (draft: CanvasDraft) => void;
  rename: (name: string) => void;
  select: (id: string | null) => void;
  /** Adds a component at an already-valid position; `replace` ids leave in the same step. */
  add: (subCategoryId: string, at: Transform, replace?: string[]) => string;
  update: (id: string, patch: Partial<Transform>) => void;
  /** Brings an item to the front of its layer. */
  bringForward: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  addText: (text: string, at: Omit<TextLayer, 'id' | 'text'>) => string;
  /** `record: false` updates live (typing) without an undo step per keystroke. */
  updateText: (id: string, patch: Partial<Omit<TextLayer, 'id'>>, record?: boolean) => void;
  undo: () => void;
  redo: () => void;
}

const empty: CanvasDraft = {
  builderType: null, categoryId: null, categoryName: '', size: null, name: '', placements: [], texts: [],
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => {
      const commit = (next: Partial<Snapshot>) => {
        const { history, historyIndex, selectedId, placements, texts } = get();
        const snapshot = { placements: next.placements ?? placements, texts: next.texts ?? texts };
        const trimmed = [...history.slice(0, historyIndex + 1), snapshot].slice(-60);
        const exists = snapshot.placements.some((item) => item.id === selectedId)
          || snapshot.texts.some((item) => item.id === selectedId);
        set({
          ...snapshot,
          history: trimmed,
          historyIndex: trimmed.length - 1,
          selectedId: exists ? selectedId : null,
        });
      };
      const fresh = { selectedId: null, history: [{ placements: [], texts: [] }], historyIndex: 0 };
      return {
        ...empty,
        ...fresh,
        saved: null,
        markSaved: (saved) => set({ saved }),
        start: (draft) => {
          const current = get();
          if (current.categoryId === draft.categoryId && current.size?.id === draft.size?.id) {
            set({ builderType: draft.builderType, categoryName: draft.categoryName, size: draft.size });
            return;
          }
          set({ ...empty, ...draft, name: `My ${draft.categoryName}`, ...fresh, saved: null });
        },
        load: (draft) => set({
          ...draft,
          selectedId: null,
          history: [{ placements: draft.placements, texts: draft.texts }],
          historyIndex: 0,
        }),
        rename: (name) => set({ name }),
        select: (selectedId) => set({ selectedId }),
        add: (subCategoryId, at, replace = []) => {
          const id = uniqueId();
          commit({ placements: [
            ...get().placements.filter((item) => !replace.includes(item.id)),
            { id, subCategoryId, ...at },
          ] });
          set({ selectedId: id });
          return id;
        },
        update: (id, patch) => commit({
          placements: get().placements.map((item) => (item.id === id ? { ...item, ...defined(patch) } : item)),
        }),
        bringForward: (id) => {
          const item = get().placements.find((entry) => entry.id === id);
          if (item) commit({ placements: [...get().placements.filter((entry) => entry.id !== id), item] });
        },
        remove: (id) => commit({
          placements: get().placements.filter((item) => item.id !== id),
          texts: get().texts.filter((item) => item.id !== id),
        }),
        clear: () => commit({ placements: [], texts: [] }),
        addText: (text, at) => {
          const id = uniqueId();
          commit({ texts: [...get().texts, { id, text, ...at }] });
          set({ selectedId: id });
          return id;
        },
        updateText: (id, patch, record = true) => {
          const texts = get().texts.map((item) => (item.id === id ? { ...item, ...defined(patch) } : item));
          if (record) commit({ texts });
          else set({ texts });
        },
        undo: () => {
          const index = get().historyIndex - 1;
          if (index >= 0) set({ ...get().history[index], historyIndex: index, selectedId: null });
        },
        redo: () => {
          const index = get().historyIndex + 1;
          if (index < get().history.length)
            set({ ...get().history[index], historyIndex: index, selectedId: null });
        },
      };
    },
    {
      name: 'homemade-canvas-draft-v1',
      storage,
      partialize: ({ builderType, categoryId, categoryName, size, name, placements, texts, saved }) =>
        ({ builderType, categoryId, categoryName, size, name, placements, texts, saved }),
      onRehydrateStorage: () => (state) => {
        if (state)
          useCanvasStore.setState({ history: [{ placements: state.placements, texts: state.texts }], historyIndex: 0 });
      },
    },
  ),
);

function defined<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<T>;
}
