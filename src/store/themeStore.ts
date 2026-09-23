import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode } from '@/constants/theme';
import { storage } from './storage';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'homemade-theme-v1', storage, partialize: ({ mode }) => ({ mode }) },
  ),
);
