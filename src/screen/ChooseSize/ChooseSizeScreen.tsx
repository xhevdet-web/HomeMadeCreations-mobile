import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { isCanvasBuilder } from '@/helper/canvasStudio';
import { CategorySize } from '@/types/models';
import { SelectedSizeDetails, SizeOption } from './components/SizeCards';

export default function ChooseSizeScreen() {
  const { t } = useTranslation();
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
    // Bouquets and gifts are designed freely on a base product, without a size limit.
    if (isCanvasBuilder(category.builderType)) {
      router.replace({ pathname: '/design-base', params: { categoryId: category.id } });
      return;
    }
    const productId = useCatalogStore.getState().registerCategory(category);
    useDesignStore.getState().start(productId, undefined, selectedSize);
    router.replace('/designer');
  }, [category]);
  useEffect(() => {
    if (category && !category.sizes?.length) openBuilder();
  }, [category, openBuilder]);
  return <Page>
    <Header title={t('jewelry.chooseSize')} back />
    {result.loading || result.error ? <CatalogState {...result} error={result.error ?? ''} empty="" /> :
      category && <>
        <Text style={ui.sectionTitle}>{category.name}</Text>
        <Text style={ui.body}>{t('jewelry.compareSizes')}</Text>
        <View style={{ gap: 12 }}>
          {category.sizes?.map(size => <SizeOption key={size.id} size={size}
            selected={size.id === selectedId} onPress={() => setSelectedId(size.id)} />)}
        </View>
        {selectedSize ? <SelectedSizeDetails size={selectedSize} /> : <Text style={ui.caption}>{t('jewelry.selectSizeHint')}</Text>}
        <Button title={t('jewelry.continueToBuilder')} icon="arrow-forward" disabled={!selectedSize}
          onPress={() => { if (selectedSize) openBuilder(selectedSize); }} />
      </>}
  </Page>;
}
