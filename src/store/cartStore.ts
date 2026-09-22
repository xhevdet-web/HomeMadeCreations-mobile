import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Design } from '@/types/models';
import { storage } from './storage';
export const useCartStore = create<{
  design: Design | null;
  setDesign: (design: Design) => void;
  clear: () => void;
}>()(
  persist(
    (set) => ({
      design: null,
      setDesign: (design) => set({ design }),
      clear: () => set({ design: null }),
    }),
    { name: 'homemade-cart-v1', storage },
  ),
);
