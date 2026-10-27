import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { isAppLanguage, type AppLanguage } from '@/i18n';
import { storage } from './storage';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

// Stores the language code ('en' | 'sq'). The root layout waits for this store to be
// restored, so a saved Albanian choice is applied before the first screen renders.
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        void i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'homemade-language-v1',
      storage,
      partialize: ({ language }) => ({ language }),
      onRehydrateStorage: () => (state) => {
        const language = isAppLanguage(state?.language) ? state.language : 'en';
        if (state && state.language !== language) state.language = language;
        void i18n.changeLanguage(language);
      },
    },
  ),
);
