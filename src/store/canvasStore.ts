import { create } from 'zustand';
import i18n from '@/i18n';
import { persist } from 'zustand/middleware';
import type { CanvasPlacement, TextLayer } from '@/api/builderModels';
import type { SavedProduct } from '@/api/commerceModels';
import type { PackagingChoice } from '@/api/packagingModels';
import type { CanvasBuilder, Transform } from '@/helper/canvasStudio';
import { uniqueId } from '@/helper/design';
import { storage } from './storage';

/** The company product a design is made on, e.g. "Wrapped Bouquet" or "Gift Box". */
export interface CanvasBase {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}

/**
 * A bouquet or gift being composed: its base product, every placed piece (array order is
 * the layer order, back to front) and personalised text.
 */
export interface CanvasDraft {
  builderType: CanvasBuilder | null;
  categoryId: string | null;
  categoryName: string;
  /** Null when the category has no base products yet and the customer starts empty. */
  base: CanvasBase | null;
  name: string;
  placements: CanvasPlacement[];
  texts: TextLayer[];
  /** GIFT: the packaging (and colour) the gift arrives in, chosen before the studio opens. */
  packaging: PackagingChoice | null;
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
  /**
   * Opens a category on a base and, for gifts, its packaging. The same category and base keep
   * the current composition, so changing the packaging never empties the gift.
   */
  start: (draft: Pick<CanvasDraft, 'builderType' | 'categoryId' | 'categoryName' | 'base'>
    & { packaging?: PackagingChoice | null }) => void;
  /** Applies one change to every piece in a single undo step, e.g. fitting them to a new box. */
  refit: (fit: (placement: CanvasPlacement) => Transform) => void;
  load: (draft: CanvasDraft) => void;
  rename: (name: string) => void;
  select: (id: string | null) => void;
  /** Adds a component at an already-valid position; `replace` ids leave in the same step. */
  add: (subCategoryId: string, at: Transform, replace?: string[]) => string;
  update: (id: string, patch: Partial<Transform>) => void;
  /** Moves a piece or text one layer forward (+1) or backward (-1). */
  shiftLayer: (id: string, direction: 1 | -1) => void;
  remove: (id: string) => void;
  clear: () => void;
  addText: (text: string, at: Omit<TextLayer, 'id' | 'text'>) => string;
  /** `record: false` updates live (typing) without an undo step per keystroke. */
  updateText: (id: string, patch: Partial<Omit<TextLayer, 'id'>>, record?: boolean) => void;
  undo: () => void;
  redo: () => void;
}

const empty: CanvasDraft = {
  builderType: null, categoryId: null, categoryName: '', base: null, name: '', placements: [], texts: [],
  packaging: null,
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
        start: ({ packaging = null, ...draft }) => {
          const current = get();
          if (current.categoryId === draft.categoryId && current.base?.id === draft.base?.id) {
            set({ builderType: draft.builderType, categoryName: draft.categoryName, base: draft.base, packaging });
            return;
          }
          set({ ...empty, ...draft, packaging, name: i18n.t('drafts.myName', { name: draft.categoryName }), ...fresh,
            saved: null });
        },
        refit: (fit) => {
          const placements = get().placements.map((item) => ({ ...item, ...fit(item) }));
          if (placements.some((item, index) => {
            const before = get().placements[index];
            return item.x !== before.x || item.y !== before.y || item.scale !== before.scale;
          })) commit({ placements });
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
        shiftLayer: (id, direction) => {
          const move = <T extends { id: string }>(list: T[]) => {
            const index = list.findIndex((entry) => entry.id === id);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= list.length) return null;
            const next = [...list];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
          };
          const placements = move(get().placements);
          const texts = placements ? null : move(get().texts);
          if (placements) commit({ placements });
          else if (texts) commit({ texts });
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
      // v2: drafts are made on a base product (v1 drafts used a category size).
      name: 'homemade-canvas-draft-v2',
      storage,
      partialize: ({ builderType, categoryId, categoryName, base, name, placements, texts, packaging, saved }) =>
        ({ builderType, categoryId, categoryName, base, name, placements, texts, packaging, saved }),
      onRehydrateStorage: () => (state) => {
        if (state)
          useCanvasStore.setState({
            history: [{ placements: state.placements, texts: state.texts }], historyIndex: 0,
            // Drafts saved before packaging was chosen up front have none.
            packaging: state.packaging ?? null,
          });
      },
    },
  ),
);

function defined<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<T>;
}
