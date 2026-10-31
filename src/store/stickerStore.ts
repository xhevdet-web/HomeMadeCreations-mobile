import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedProduct } from '@/api/commerceModels';
import { clampTransform, DEFAULT_TRANSFORM, type CaseTransform, type Size } from '@/helper/caseStudio';
import {
  clampQuantity, DEFAULT_STICKER_QUANTITY, MAX_STICKER_DESIGNS, type StickerSize,
} from '@/helper/stickers';
import { storage } from './storage';

/** One design of the set: the customer's artwork, where it sits and how many to print. */
export interface StickerDesign extends CaseTransform {
  /** Local id, only to tell designs apart while editing. */
  id: string;
  /** The category's "Your own artwork" (CUSTOM_UPLOAD) component, once an image is added. */
  subCategoryId: string | null;
  /** The customer's upload: a local pick, or the stored URL of a saved set. */
  imageUri?: string;
  /** Or one of the category's designs (its SubCategory image), when not an upload. */
  designImageUrl?: string;
  /** Pixel size, for the cover fit and the quality hint; read again when missing. */
  imageSize?: Size | null;
  quantity: number;
}

/** Last saved Product for this exact set, so an unchanged set isn't uploaded twice. */
interface SavedStickers { userId: string; signature: string; product: SavedProduct }

interface StickerDraft {
  categoryId: string | null;
  /** Shape and size of every design in the set. */
  size: StickerSize | null;
  name: string;
  designs: StickerDesign[];
  activeId: string | null;
}

interface StickerState extends StickerDraft {
  saved: SavedStickers | null;
  start: (categoryId: string, name: string) => void;
  /** After an order: the same shape and size, with one empty design and nothing saved. */
  startOver: (name: string) => void;
  load: (draft: StickerDraft) => void;
  /**
   * A new shape or size keeps every image but re-centres it at the default fit, since a
   * placement made for one outline doesn't suit another.
   */
  setSize: (size: StickerSize) => void;
  /** Adds an empty design (up to five) and opens it. */
  addDesign: () => void;
  select: (id: string) => void;
  /**
   * Puts an upload or one of our designs on one design, at the default fit or where it was
   * dropped; other designs are untouched.
   */
  setImage: (id: string, image: Pick<StickerDesign, 'subCategoryId' | 'imageUri' | 'designImageUrl' | 'imageSize'>,
    placement?: Partial<CaseTransform>) => void;
  transform: (id: string, next: CaseTransform) => void;
  setImageSize: (id: string, imageSize: Size) => void;
  reset: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  /** Removes a design; the last one is emptied instead, so a set always has one. */
  removeDesign: (id: string) => void;
  markSaved: (saved: SavedStickers | null) => void;
}

const newDesign = (): StickerDesign => ({
  id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  subCategoryId: null,
  quantity: DEFAULT_STICKER_QUANTITY,
  ...DEFAULT_TRANSFORM,
});

const empty: StickerDraft = { categoryId: null, size: null, name: '', designs: [], activeId: null };

export const useStickerStore = create<StickerState>()(
  persist(
    (set, get) => {
      const update = (id: string, change: (design: StickerDesign) => Partial<StickerDesign>) =>
        set({ designs: get().designs.map((design) => (design.id === id ? { ...design, ...change(design) } : design)) });
      return {
        ...empty,
        saved: null,
        start: (categoryId, name) => {
          const first = newDesign();
          set({ ...empty, categoryId, name, designs: [first], activeId: first.id, saved: null });
        },
        startOver: (name) => {
          const first = newDesign();
          set({ name, designs: [first], activeId: first.id, saved: null });
        },
        load: (draft) => set({ ...draft }),
        setSize: (size) => {
          const previous = get().size;
          const same = previous && previous.shape === size.shape && previous.widthMm === size.widthMm
            && previous.heightMm === size.heightMm;
          set({
            size,
            designs: same ? get().designs : get().designs.map((design) => ({ ...design, ...DEFAULT_TRANSFORM })),
          });
        },
        addDesign: () => {
          if (get().designs.length >= MAX_STICKER_DESIGNS) return;
          const design = newDesign();
          set({ designs: [...get().designs, design], activeId: design.id });
        },
        select: (id) => set({ activeId: id }),
        setImage: (id, image, placement) => update(id, () => ({
          imageUri: undefined, designImageUrl: undefined, ...image, ...DEFAULT_TRANSFORM, ...placement,
        })),
        transform: (id, next) => update(id, () => clampTransform(next)),
        setImageSize: (id, imageSize) => update(id, () => ({ imageSize })),
        reset: (id) => update(id, () => DEFAULT_TRANSFORM),
        setQuantity: (id, quantity) => update(id, () => ({ quantity: clampQuantity(quantity) })),
        removeDesign: (id) => {
          const designs = get().designs;
          if (designs.length <= 1) {
            update(id, () => ({
              subCategoryId: null, imageUri: undefined, designImageUrl: undefined, imageSize: null, ...DEFAULT_TRANSFORM,
            }));
            return;
          }
          const index = designs.findIndex((design) => design.id === id);
          const rest = designs.filter((design) => design.id !== id);
          set({
            designs: rest,
            activeId: get().activeId === id ? rest[Math.min(index, rest.length - 1)].id : get().activeId,
          });
        },
        markSaved: (saved) => set({ saved }),
      };
    },
    {
      name: 'homemade-sticker-draft-v1',
      storage,
      partialize: ({ categoryId, size, name, designs, activeId, saved }) =>
        ({ categoryId, size, name, designs, activeId, saved }),
    },
  ),
);
