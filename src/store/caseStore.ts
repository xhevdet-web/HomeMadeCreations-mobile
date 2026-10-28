import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedProduct } from '@/api/commerceModels';
import { clampTransform, DEFAULT_TRANSFORM, type CaseTransform, type Size } from '@/helper/caseStudio';
import { storage } from './storage';

/**
 * The one image on the case: a library design (SubCategory) or the customer's own photo
 * (the CUSTOM_UPLOAD SubCategory with `imageUri`), and where it sits.
 */
export interface CaseArtwork extends CaseTransform {
  subCategoryId: string;
  /** Own photo: a local pick, or the stored URL of a saved design. */
  imageUri?: string;
  /** Pixel size, for the cover fit and the quality hint; read again when missing. */
  imageSize?: Size | null;
}

/** Last saved Product for this exact design, so an unchanged design isn't uploaded twice. */
interface SavedCase { userId: string; signature: string; product: SavedProduct }

interface CaseDraft {
  categoryId: string | null;
  /** The phone model: a COMPANY product of the category, e.g. "iPhone 14". */
  modelId: string | null;
  name: string;
  artwork: CaseArtwork | null;
  /**
   * The customer's own photo stays here while they try a library design, so switching
   * back never asks them to upload it again.
   */
  photo: Pick<CaseArtwork, 'imageUri' | 'imageSize' | 'subCategoryId'> | null;
}

interface CaseState extends CaseDraft {
  saved: SavedCase | null;
  start: (categoryId: string, name: string) => void;
  load: (draft: CaseDraft) => void;
  rename: (name: string) => void;
  /**
   * Another model has another printable area, so the image is kept but re-centred at the
   * default fit instead of reusing a placement made for a different shape.
   */
  setModel: (modelId: string) => void;
  /** Puts a design or photo on the case, filling the printable area. */
  choose: (artwork: Pick<CaseArtwork, 'subCategoryId' | 'imageUri' | 'imageSize'>) => void;
  transform: (next: CaseTransform) => void;
  setImageSize: (imageSize: Size) => void;
  reset: () => void;
  clear: () => void;
  markSaved: (saved: SavedCase | null) => void;
}

const empty: CaseDraft = { categoryId: null, modelId: null, name: '', artwork: null, photo: null };

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      ...empty,
      saved: null,
      start: (categoryId, name) => set({ ...empty, categoryId, name, saved: null }),
      load: (draft) => set({ ...draft }),
      rename: (name) => set({ name }),
      setModel: (modelId) => set((state) => state.modelId === modelId ? {} : {
        modelId,
        artwork: state.artwork ? { ...state.artwork, ...DEFAULT_TRANSFORM } : null,
      }),
      choose: (artwork) => set({
        artwork: { ...artwork, ...DEFAULT_TRANSFORM },
        ...(artwork.imageUri ? { photo: artwork } : {}),
      }),
      transform: (next) => {
        const artwork = get().artwork;
        if (artwork) set({ artwork: { ...artwork, ...clampTransform(next) } });
      },
      setImageSize: (imageSize) => {
        const artwork = get().artwork;
        if (artwork) set({ artwork: { ...artwork, imageSize } });
      },
      reset: () => {
        const artwork = get().artwork;
        if (artwork) set({ artwork: { ...artwork, ...DEFAULT_TRANSFORM } });
      },
      clear: () => set({ artwork: null }),
      markSaved: (saved) => set({ saved }),
    }),
    {
      name: 'homemade-case-draft-v1',
      storage,
      partialize: ({ categoryId, modelId, name, artwork, photo, saved }) =>
        ({ categoryId, modelId, name, artwork, photo, saved }),
    },
  ),
);
