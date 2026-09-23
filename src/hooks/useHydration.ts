import { useEffect, useState } from 'react';
import { useSavedStore } from '@/store/savedStore';
import { useOrderStore } from '@/store/orderStore';
import { useCartStore } from '@/store/cartStore';
import { useDesignStore } from '@/store/designStore';
import { useThemeStore } from '@/store/themeStore';
import { useOnboardingStore } from '@/store/onboardingStore';
const stores = [useSavedStore, useOrderStore, useCartStore, useDesignStore, useThemeStore, useOnboardingStore];
export function useHydration() {
  const [hydrated, setHydrated] = useState(stores.every((store) => store.persist.hasHydrated()));
  useEffect(() => {
    const update = () => setHydrated(stores.every((store) => store.persist.hasHydrated()));
    const subscriptions = stores.map((store) => store.persist.onFinishHydration(update));
    update();
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, []);
  return hydrated;
}
