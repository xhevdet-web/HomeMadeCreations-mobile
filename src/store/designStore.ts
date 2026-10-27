import { create } from 'zustand';
import i18n from '@/i18n';
import { persist } from 'zustand/middleware';
import { CategorySize, Design, DesignItem } from '@/types/models';
import { itemById, productById } from '@/services/catalog';
import { normalizePositions, uniqueId } from '@/helper/design';
import { canFit, lengthOf, selectedLengthMm, sizeLabel, usedLengthMm } from '@/helper/jewelry';
import { storage } from './storage';

interface DesignState {
  description: string;
  describe: (description: string) => void;
  productId: string;
  name: string;
  size: string;
  selectedSize: CategorySize | null;
  designId: string | null;
  items: DesignItem[];
  selectedId: string | null;
  history: DesignItem[][];
  historyIndex: number;
  start: (productId: string, size?: string, selectedSize?: CategorySize | null) => void;
  /**
   * Changes the size or exact length of the current design, keeping every component. It
   * refuses (returns false) when the components no longer fit: nothing is ever removed.
   */
  resize: (selectedSize: CategorySize) => boolean;
  load: (design: Design) => void;
  rename: (name: string) => void;
  select: (id: string | null) => void;
  addItem: (itemId: string) => void;
  insertItem: (itemId: string, index: number, angle?: number) => void;
  replaceItemAt: (id: string, itemId: string) => void;
  placeItem: (id: string, index: number) => void;
  replaceItem: (itemId: string) => void;
  removeItem: () => void;
  moveItem: (direction: number) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  snapshot: (userId: string) => Design;
  markSaved: (id: string) => void;
}
export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => {
      // Array order is the bead sequence along the cord; beads are always evenly spaced,
      // so free-form angles are dropped and the saved positions match what is shown.
      const commit = (next: DesignItem[]) => {
        const items = normalizePositions(next.map(({ angle: _angle, ...entry }) => entry));
        const state = get();
        const history = [...state.history.slice(0, state.historyIndex + 1), items].slice(-60);
        set({
          items,
          history,
          historyIndex: history.length - 1,
          selectedId: items.some((item) => item.id === state.selectedId) ? state.selectedId : null,
        });
      };
      // Room on the piece: bracelets by physical length (the replaced piece makes room),
      // other sized pieces by their component count.
      const hasRoom = (id: string, replacing?: string | null) => {
        const size = get().selectedSize;
        const selected = selectedLengthMm(size);
        if (selected !== null) {
          const length = lengthOf(id);
          return length !== null && canFit(usedLengthMm(get().items, replacing), length, selected);
        }
        return !!replacing || get().items.length < (size?.maxItems ?? Infinity);
      };
      const canAdd = (id: string, excluding?: string | null) => {
        const item = itemById[id];
        return (
          item?.available &&
          get().items.filter((entry) => entry.itemId === id && entry.id !== excluding).length <
            item.stock
        );
      };
      return {
        description: '',
        describe: (description) => set({ description }),
        productId: 'bracelet-classic',
        name: i18n.t('drafts.masterpiece'),
        size: 'M · 17 cm',
        selectedSize: null,
        designId: null,
        items: [],
        selectedId: null,
        history: [[]],
        historyIndex: 0,
        start: (productId, size, selectedSize = null) =>
          set({
            description: '',
            productId,
            selectedSize,
            size: selectedSize ? sizeLabel(selectedSize) :
              (productById[productId].categoryId ? '' : size ?? productById[productId].sizes[1]),
            name: i18n.t('drafts.myName', { name: productById[productId].name }),
            designId: null,
            items: [],
            selectedId: null,
            history: [[]],
            historyIndex: 0,
          }),
        load: (design) =>
          set({
            description: design.description ?? '',
            productId: design.productId,
            size: design.size,
            selectedSize: design.selectedSize ?? null,
            name: design.name,
            designId: design.id,
            items: design.items,
            selectedId: null,
            history: [design.items],
            historyIndex: 0,
          }),
        rename: (name) => set({ name }),
        resize: (selectedSize) => {
          const length = selectedLengthMm(selectedSize);
          const fits = length !== null
            ? canFit(usedLengthMm(get().items), 0, length)
            : get().items.length <= (selectedSize.maxItems ?? Infinity);
          if (fits) set({ selectedSize, size: sizeLabel(selectedSize) });
          return fits;
        },
        select: (selectedId) => set({ selectedId }),
        markSaved: (designId) => set({ designId }),
        addItem: (itemId) => {
          if (hasRoom(itemId) && canAdd(itemId))
            commit([...get().items, { id: uniqueId(), itemId, position: get().items.length }]);
        },
        insertItem: (itemId, index) => {
          if (!hasRoom(itemId) || !canAdd(itemId)) return;
          const next = [...get().items];
          next.splice(Math.max(0, Math.min(index, next.length)), 0, {
            id: uniqueId(), itemId, position: index,
          });
          commit(next);
        },
        replaceItemAt: (id, itemId) => {
          if (hasRoom(itemId, id) && canAdd(itemId, id))
            commit(get().items.map((entry) => entry.id === id ? { ...entry, itemId } : entry));
        },
        placeItem: (id, index) => {
          const entry = get().items.find((item) => item.id === id);
          if (!entry) return;
          // Move the bead to the strand position nearest to where it was dropped.
          const others = get().items.filter((item) => item.id !== id);
          others.splice(Math.max(0, Math.min(index, others.length)), 0, entry);
          commit(others);
        },
        replaceItem: (itemId) => {
          if (get().selectedId && hasRoom(itemId, get().selectedId) && canAdd(itemId, get().selectedId))
            commit(
              get().items.map((entry) =>
                entry.id === get().selectedId ? { ...entry, itemId } : entry,
              ),
            );
        },
        removeItem: () => {
          if (get().selectedId)
            commit(get().items.filter((entry) => entry.id !== get().selectedId));
        },
        moveItem: (direction) => {
          const next = [...get().items];
          const from = next.findIndex((entry) => entry.id === get().selectedId);
          const to = from + direction;
          if (from < 0 || to < 0 || to >= next.length) return;
          [next[from], next[to]] = [next[to], next[from]];
          commit(next);
        },
        clear: () => {
          if (get().items.length) commit([]);
        },
        undo: () => {
          const index = get().historyIndex - 1;
          if (index >= 0)
            set({ items: get().history[index], historyIndex: index, selectedId: null });
        },
        redo: () => {
          const index = get().historyIndex + 1;
          if (index < get().history.length)
            set({ items: get().history[index], historyIndex: index, selectedId: null });
        },
        snapshot: (userId) => ({
          description: get().description,
          id: get().designId ?? uniqueId(),
          userId,
          name: get().name.trim() || i18n.t('drafts.masterpiece'),
          productId: get().productId,
          size: get().size,
          selectedSize: get().selectedSize,
          items: get().items.map((entry) => ({ ...entry })),
          updatedAt: new Date().toISOString(),
        }),
      };
    },
    { name: 'homemade-draft-v1', storage },
  ),
);
