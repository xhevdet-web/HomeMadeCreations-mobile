import { ComponentProps, useCallback } from 'react';
import { Text, View } from 'react-native';
import { BeadPicker } from './BeadPicker';
import { CatalogState } from '@/components/products/CatalogState';
import { useUI } from '@/components/common/ui';
import { useRemote } from '@/hooks/useRemote';
import { fetchCategoryComponents } from '@/services/catalogApi';
import { useCatalogStore } from '@/store/catalogStore';

export function CategoryBeadPicker({ categoryId, ...props }:
  ComponentProps<typeof BeadPicker> & { categoryId: string }) {
  const ui = useUI();
  const load = useCallback(async (signal: AbortSignal) => {
    const components = await fetchCategoryComponents(categoryId, signal);
    if (signal.aborted) return [];
    return useCatalogStore.getState().registerComponents(components);
  }, [categoryId]);
  const catalog = useRemote(load);
  if (catalog.loading || catalog.error || !catalog.data?.length) return <View>
    <Text style={ui.sectionTitle}>Choose your details</Text>
    <CatalogState {...catalog} error={catalog.error ?? ''} empty="No components are available in this category yet." />
  </View>;
  return <BeadPicker {...props} sourceItems={catalog.data} />;
}
