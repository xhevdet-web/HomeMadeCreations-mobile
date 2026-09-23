import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage } from './storage';

// Only a welcome preference is stored here. Session tokens stay in secure storage.
export const useOnboardingStore = create<{ completed: boolean; complete: () => void }>()(
  persist(
    (set) => ({ completed: false, complete: () => set({ completed: true }) }),
    { name: 'homemade-onboarding-v1', storage },
  ),
);
