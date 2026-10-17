import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { CategorySize } from '@/types/models';
import { SelectedSizeDetails, SizeOption } from './components/SizeCards';

export default function ChooseSizeScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const ui = useUI();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const opening = useRef(false);
  const result = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId ?? '', { skip: !categoryId }));
  const category = result.data?.isActive ? result.data : undefined;
  const selectedSize = category?.sizes?.find(size => size.id === selectedId);
  const openBuilder = useCallback((selectedSize?: CategorySize) => {
    if (!category || opening.current) return;
    opening.current = true;
    const productId = useCatalogStore.getState().registerCategory(category);
    useDesignStore.getState().start(productId, undefined, selectedSize);
    router.replace('/designer');
  }, [category]);
  useEffect(() => {
    if (category && !category.sizes?.length) openBuilder();
  }, [category, openBuilder]);
  return <Page>
    <Header title="Choose Size" back />
    {result.loading || result.error ? <CatalogState {...result} error={result.error ?? ''} empty="" /> :
      category && <>
        <Text style={ui.sectionTitle}>{category.name}</Text>
        <Text style={ui.body}>Compare the measurements and component limits. Select a size to see its details before continuing.</Text>
        <View style={{ gap: 12 }}>
          {category.sizes?.map(size => <SizeOption key={size.id} size={size}
            selected={size.id === selectedId} onPress={() => setSelectedId(size.id)} />)}
        </View>
        {selectedSize ? <SelectedSizeDetails size={selectedSize} /> : <Text style={ui.caption}>Select a size above to review its details.</Text>}
        <Button title="Continue to Builder" icon="arrow-forward" disabled={!selectedSize}
          onPress={() => { if (selectedSize) openBuilder(selectedSize); }} />
      </>}
  </Page>;
}
