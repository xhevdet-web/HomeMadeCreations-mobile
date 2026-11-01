import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TextLayer } from '@/api/builderModels';
import type { SavedProduct } from '@/api/commerceModels';
import { DEFAULT_TRANSFORM, type CaseTransform, type Size } from '@/helper/caseStudio';
import { uniqueId } from '@/helper/design';
import { clampElement, MAX_MUG_ELEMENTS } from '@/helper/mugs';
import { storage } from './storage';

/** One image of the mug design. Array order is the layer order (later = in front). */
export interface MugElement extends CaseTransform {
  id: string;
  /** The category's "Your own image" (CUSTOM_UPLOAD) or one of its designs. */
  subCategoryId: string;
  /** The customer's upload: a local pick, or the stored URL of a saved design. */
  imageUri?: string;
  /** Or one of the category's designs (its SubCategory image). */
  designImageUrl?: string;
  /** Pixel size, for the image's proportions and the quality hint; read again when missing. */
  imageSize?: Size | null;
}

export type MugImage = Pick<MugElement, 'subCategoryId' | 'imageUri' | 'designImageUrl' | 'imageSize'>;

/** Last saved Product for this exact design, so an unchanged design isn't uploaded twice. */
interface SavedMug { userId: string; signature: string; product: SavedProduct }

interface MugDraft {
  categoryId: string | null;
  /** The blank mug the design is printed on. */
  baseProductId: string | null;
  name: string;
  elements: MugElement[];
  /** Personalised text; x/y are fractions of the whole print, like the images. */
  texts: TextLayer[];
}

/** One undo step: the whole design. */
interface Snapshot { elements: MugElement[]; texts: TextLayer[] }

interface MugState extends MugDraft {
  /** An image or a text id. */
  selectedId: string | null;
  history: Snapshot[];
  historyIndex: number;
  saved: SavedMug | null;
  start: (categoryId: string, baseProductId: string, name: string) => void;
  load: (draft: Omit<MugDraft, 'texts'> & { texts?: TextLayer[] }) => void;
  /** After an order: the same mug, with an empty design and nothing saved. */
  startOver: (name: string) => void;
  setBase: (baseProductId: string) => void;
  select: (id: string | null) => void;
  /**
   * Adds an image where it was dropped, else around `centreX` (the middle of the side
   * being viewed), and selects it. The studio keeps it inside the print (see fitInside).
   */
  add: (image: MugImage, placement: Partial<CaseTransform>, centreX?: number) => string | null;
  /** Moves, zooms or rotates one image; the studio has already kept it inside the print. */
  update: (id: string, next: CaseTransform) => void;
  /** Puts another image in an image's place; `placement` moves or resets it in the same step. */
  replace: (id: string, image: MugImage, placement?: Partial<CaseTransform>) => void;
  /** Records an image's pixel size (no undo step); `fit` keeps the now-known shape inside. */
  setImageSize: (id: string, imageSize: Size, fit?: (element: MugElement) => CaseTransform) => void;
  duplicate: (id: string) => void;
  /** Removes an image or a text. */
  remove: (id: string) => void;
  /** One layer forward (+1) or backward (-1). */
  moveLayer: (id: string, direction: 1 | -1) => void;
  addText: (text: Omit<TextLayer, 'id'>) => string;
  /** `record: false` updates live (typing) without an undo step per keystroke. */
  updateText: (id: string, patch: Partial<Omit<TextLayer, 'id'>>, record?: boolean) => void;
  undo: () => void;
  redo: () => void;
  markSaved: (saved: SavedMug | null) => void;
}

const empty: MugDraft = { categoryId: null, baseProductId: null, name: '', elements: [], texts: [] };
const fresh = { selectedId: null, history: [{ elements: [], texts: [] }] as Snapshot[], historyIndex: 0 };

export const useMugStore = create<MugState>()(
  persist(
    (set, get) => {
      /** Every change is one undo step (at most 60 kept). */
      const commit = (next: Partial<Snapshot>, selectedId = get().selectedId) => {
        const { history, historyIndex, elements, texts } = get();
        const snapshot = { elements: next.elements ?? elements, texts: next.texts ?? texts };
        const trimmed = [...history.slice(0, historyIndex + 1), snapshot].slice(-60);
        const exists = snapshot.elements.some((element) => element.id === selectedId)
          || snapshot.texts.some((text) => text.id === selectedId);
        set({ ...snapshot, history: trimmed, historyIndex: trimmed.length - 1, selectedId: exists ? selectedId : null });
      };
      const change = (id: string, patch: (element: MugElement) => Partial<MugElement>) =>
        commit({ elements: get().elements.map((element) => (element.id === id ? { ...element, ...patch(element) } : element)) });
      return {
        ...empty,
        ...fresh,
        saved: null,
        start: (categoryId, baseProductId, name) => set({ ...empty, categoryId, baseProductId, name, ...fresh, saved: null }),
        load: (draft) => {
          const texts = draft.texts ?? [];
          set({ ...draft, texts, ...fresh, history: [{ elements: draft.elements, texts }] });
        },
        startOver: (name) => set({ name, elements: [], texts: [], ...fresh, saved: null }),
        setBase: (baseProductId) => set({ baseProductId }),
        select: (selectedId) => set({ selectedId }),
        add: (image, placement, centreX = 0.5) => {
          const elements = get().elements;
          if (elements.length >= MAX_MUG_ELEMENTS) return null;
          const id = uniqueId();
          // Cascade new images slightly so repeated adds don't stack exactly.
          const nudge = (elements.length % 3) * 0.04;
          commit({ elements: [...elements, {
            id, ...image, ...clampElement({ ...DEFAULT_TRANSFORM, x: centreX + nudge, y: 0.5 + nudge, ...placement }),
          }] }, id);
          return id;
        },
        update: (id, next) => change(id, () => clampElement(next)),
        replace: (id, image, placement) => change(id, () => ({
          imageUri: undefined, designImageUrl: undefined, ...image, ...placement,
        })),
        setImageSize: (id, imageSize, fit) => set({
          elements: get().elements.map((element) => {
            if (element.id !== id) return element;
            const sized = { ...element, imageSize };
            return fit ? { ...sized, ...fit(sized) } : sized;
          }),
        }),
        duplicate: (id) => {
          const elements = get().elements;
          const source = elements.find((element) => element.id === id);
          if (!source || elements.length >= MAX_MUG_ELEMENTS) return;
          const copy = { ...source, id: uniqueId(), ...clampElement({ ...source, x: source.x + 0.06, y: source.y + 0.06 }) };
          const index = elements.indexOf(source);
          commit({ elements: [...elements.slice(0, index + 1), copy, ...elements.slice(index + 1)] }, copy.id);
        },
        remove: (id) => commit({
          elements: get().elements.filter((element) => element.id !== id),
          texts: get().texts.filter((text) => text.id !== id),
        }),
        moveLayer: (id, direction) => {
          const elements = [...get().elements];
          const index = elements.findIndex((element) => element.id === id);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= elements.length) return;
          [elements[index], elements[target]] = [elements[target], elements[index]];
          commit({ elements });
        },
        addText: (text) => {
          const id = uniqueId();
          commit({ texts: [...get().texts, { id, ...text }] }, id);
          return id;
        },
        updateText: (id, patch, record = true) => {
          const texts = get().texts.map((text) => (text.id === id ? { ...text, ...defined(patch) } : text));
          if (record) commit({ texts });
          else set({ texts });
        },
        undo: () => {
          const index = get().historyIndex - 1;
          if (index >= 0) set({ ...get().history[index], historyIndex: index, selectedId: null });
        },
        redo: () => {
          const index = get().historyIndex + 1;
          if (index < get().history.length) set({ ...get().history[index], historyIndex: index, selectedId: null });
        },
        markSaved: (saved) => set({ saved }),
      };
    },
    {
      name: 'homemade-mug-draft-v1',
      storage,
      partialize: ({ categoryId, baseProductId, name, elements, texts, saved }) =>
        ({ categoryId, baseProductId, name, elements, texts, saved }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // A draft from when mugs allowed more images keeps its front ones, up to the limit;
        // drafts from before text existed have none.
        const elements = state.elements.slice(-MAX_MUG_ELEMENTS);
        const texts = state.texts ?? [];
        useMugStore.setState({ elements, texts, history: [{ elements, texts }], historyIndex: 0 });
      },
    },
  ),
);

function defined<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<T>;
}
