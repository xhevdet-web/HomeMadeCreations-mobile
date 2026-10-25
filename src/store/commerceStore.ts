import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiOrder, SavedProduct } from '@/api/commerceModels';
import { storage } from './storage';
export const useCommerceStore = create<{
  /** `size` is the chosen size of a company product sold in sizes. */
  checkout: { userId: string; product: SavedProduct; size?: string | null; notes?: string } | null;
  savedDraft: { userId: string; signature: string; product: SavedProduct } | null;
  pending: Record<string, boolean>;
  lastOrder: ApiOrder | null;
  rememberOrder: (order: ApiOrder) => void;
  setCheckout: (userId: string, product: SavedProduct, size?: string | null) => void;
  setCheckoutNotes: (userId: string, productId: string, notes: string) => void;
  saveDraft: (userId: string, signature: string, product: SavedProduct) => void;
  clearDraft: () => void;
  setPending: (key: string, value: boolean) => void;
}>()(
  persist(
    (set) => ({
      checkout: null,
      savedDraft: null,
      pending: {},
      lastOrder: null,
      rememberOrder: (lastOrder) => set({ lastOrder }),
      setCheckout: (userId, product, size = null) => set({ checkout: { userId, product, size } }),
      setCheckoutNotes: (userId, productId, notes) =>
        set((state) =>
          state.checkout?.userId === userId && state.checkout.product.id === productId
            ? { checkout: { ...state.checkout, notes } }
            : {},
        ),
      saveDraft: (userId, signature, product) =>
        set({ savedDraft: { userId, signature, product } }),
      clearDraft: () => set({ savedDraft: null }),
      setPending: (key, value) => set((state) => ({ pending: { ...state.pending, [key]: value } })),
    }),
    { name: 'homemade-commerce-v1', storage },
  ),
);
