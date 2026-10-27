import { useState } from 'react';
import { FlatList, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useApiResult } from '@/api/useApiResult';
import { CatalogComponent } from '@/api/catalogModels';
import { ComponentCard } from './components/ComponentCard';

function ComponentList({ categoryId }: { categoryId: string }) {
  const { t } = useTranslation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const catalog = useApiResult<CatalogComponent[]>(useGetCategoryComponentsQuery(categoryId));
  return (
    <FlatList
      data={catalog.data ?? []}
      extraData={quantities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <ComponentCard
          component={item}
          selected={quantities[item.id] ?? 0}
          setSelected={(quantity) =>
            setQuantities((current) => ({ ...current, [item.id]: quantity }))
          }
        />
      )}
      ListEmptyComponent={
        <CatalogState {...catalog} empty={t('jewelry.noComponents')} />
      }
    />
  );
}

export default function ComponentsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ categoryId?: string; category?: string }>();
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const ui = useUI();
  return (
    <Page scroll={false}>
      <Header title={typeof params.category === 'string' ? params.category : t('jewelry.components')} back />
      {categoryId ? (
        <ComponentList key={categoryId} categoryId={categoryId} />
      ) : (
        <>
          <Text style={ui.body}>{t('jewelry.chooseCategoryComponents')}</Text>
          <Button title={t('jewelry.browseCategories')} onPress={() => router.replace('/categories')} />
        </>
      )}
    </Page>
  );
}
