import { ComponentProps, useEffect } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BeadPicker } from './BeadPicker';
import { CatalogState } from '@/components/products/CatalogState';
import { useUI } from '@/components/common/ui';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useApiResult } from '@/api/useApiResult';
import { useCatalogStore } from '@/store/catalogStore';
import type { CatalogComponent } from '@/api/catalogModels';

export function CategoryBeadPicker({ categoryId, ...props }:
  ComponentProps<typeof BeadPicker> & { categoryId: string }) {
  const ui = useUI();
  const { t } = useTranslation();
  const catalog = useApiResult<CatalogComponent[]>(useGetCategoryComponentsQuery(categoryId));
  const registered = useCatalogStore((state) => state.items);
  useEffect(() => {
    if (catalog.data) useCatalogStore.getState().registerComponents(catalog.data);
  }, [catalog.data]);
  const items = catalog.data?.map((component) => registered[component.id]).filter((item) => !!item) ?? [];
  if (catalog.loading || catalog.error || !items.length) return <View>
    <Text style={ui.sectionTitle}>{t('jewelry.chooseDetails')}</Text>
    <CatalogState {...catalog} error={catalog.error ?? ''} empty={t('jewelry.noComponents')} />
  </View>;
  return <BeadPicker {...props} sourceItems={items} />;
}
