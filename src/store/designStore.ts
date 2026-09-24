import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Design, DesignItem } from '@/types/models';
import { itemById, productById } from '@/services/catalog';
import { normalizePositions, uniqueId } from '@/helper/design';
import { storage } from './storage';

interface DesignState {
  productId: string;
  name: string;
  size: string;
  designId: string | null;
  items: DesignItem[];
  selectedId: string | null;
  history: DesignItem[][];
  historyIndex: number;
  start: (productId: string, size?: string) => void;
  load: (design: Design) => void;
  rename: (name: string) => void;
  select: (id: string | null) => void;
  addItem: (itemId: string) => void;
  insertItem: (itemId: string, index: number, angle?: number) => void;
  replaceItemAt: (id: string, itemId: string) => void;
  placeItem: (id: string, angle: number) => void;
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
      const commit = (next: DesignItem[]) => {
        const items = normalizePositions(next);
        const state = get();
        const history = [...state.history.slice(0, state.historyIndex + 1), items].slice(-60);
        set({
          items,
          history,
          historyIndex: history.length - 1,
          selectedId: items.some((item) => item.id === state.selectedId) ? state.selectedId : null,
        });
      };
      const canAdd = (id: string, excluding?: string | null) => {
        const item = itemById[id];
        return (
          item?.available &&
          get().items.filter((entry) => entry.itemId === id && entry.id !== excluding).length <
            item.stock
        );
      };
      const nextAngle = () => {
        const entries = get().items;
        if (!entries.length) return 0;
        const angles = entries.map((entry, index) => entry.angle ?? index / entries.length)
          .sort((a, b) => a - b);
        let largestGap = -1;
        let choice = 0;
        angles.forEach((angle, index) => {
          const next = index === angles.length - 1 ? angles[0] + 1 : angles[index + 1];
          if (next - angle > largestGap) {
            largestGap = next - angle;
            choice = (angle + largestGap / 2) % 1;
          }
        });
        return choice;
      };
      return {
        productId: 'bracelet-classic',
        name: 'My little masterpiece',
        size: 'M · 17 cm',
        designId: null,
        items: [],
        selectedId: null,
        history: [[]],
        historyIndex: 0,
        start: (productId, size) =>
          set({
            productId,
            size: size ?? productById[productId].sizes[1],
            name: `My ${productById[productId].name}`,
            designId: null,
            items: [],
            selectedId: null,
            history: [[]],
            historyIndex: 0,
          }),
        load: (design) =>
          set({
            productId: design.productId,
            size: design.size,
            name: design.name,
            designId: design.id,
            items: design.items,
            selectedId: null,
            history: [design.items],
            historyIndex: 0,
          }),
        rename: (name) => set({ name }),
        select: (selectedId) => set({ selectedId }),
        markSaved: (designId) => set({ designId }),
        addItem: (itemId) => {
          if (get().items.length < 32 && canAdd(itemId))
            commit([...get().items, { id: uniqueId(), itemId, position: get().items.length,
              angle: nextAngle() }]);
        },
        insertItem: (itemId, index, angle) => {
          if (get().items.length >= 32 || !canAdd(itemId)) return;
          const next = [...get().items];
          next.splice(Math.max(0, Math.min(index, next.length)), 0, {
            id: uniqueId(), itemId, position: index, angle: angle ?? nextAngle(),
          });
          commit(next);
        },
        replaceItemAt: (id, itemId) => {
          if (canAdd(itemId, id))
            commit(get().items.map((entry) => entry.id === id ? { ...entry, itemId } : entry));
        },
        placeItem: (id, angle) => {
          if (!get().items.some((entry) => entry.id === id)) return;
          commit(get().items.map((entry) => entry.id === id ? { ...entry, angle } : entry));
        },
        replaceItem: (itemId) => {
          if (get().selectedId && canAdd(itemId, get().selectedId))
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
          const fromAngle = next[from].angle ?? from / next.length;
          const toAngle = next[to].angle ?? to / next.length;
          next[from] = { ...next[from], angle: toAngle };
          next[to] = { ...next[to], angle: fromAngle };
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
          id: get().designId ?? uniqueId(),
          userId,
          name: get().name.trim() || 'My little masterpiece',
          productId: get().productId,
          size: get().size,
          items: get().items.map((entry) => ({ ...entry })),
          updatedAt: new Date().toISOString(),
        }),
      };
    },
    { name: 'homemade-draft-v1', storage },
  ),
);
