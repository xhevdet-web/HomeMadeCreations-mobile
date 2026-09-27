import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiOrder, SavedProduct } from '@/services/commerceApi';
import { storage } from './storage';
export const useCommerceStore = create<{
  checkout: { userId: string; product: SavedProduct } | null;
  savedDraft: { userId: string; signature: string; product: SavedProduct } | null;
  pending: Record<string, boolean>;
  lastOrder: ApiOrder | null;
  rememberOrder: (order: ApiOrder) => void;
  setCheckout: (userId: string, product: SavedProduct) => void;
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
      setCheckout: (userId, product) => set({ checkout: { userId, product } }),
      saveDraft: (userId, signature, product) =>
        set({ savedDraft: { userId, signature, product } }),
      clearDraft: () => set({ savedDraft: null }),
      setPending: (key, value) => set((state) => ({ pending: { ...state.pending, [key]: value } })),
    }),
    { name: 'homemade-commerce-v1', storage },
  ),
);
