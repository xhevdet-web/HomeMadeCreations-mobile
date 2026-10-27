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
import { canFit, cm, isMeasuredSize, pieceOf, selectedLengthMm, usedLengthMm } from '@/helper/jewelry';
import { CategorySize } from '@/types/models';
import { SelectedSizeDetails, SizeOption } from './components/SizeCards';
import { LengthSelector, LengthSummary, SizeRangeOption } from './components/LengthSizeCards';

/**
 * Choose the size before designing. Bracelets and necklaces pick a length range, then the
 * exact length (in half centimetres); sizes saved in the older format keep their component
 * count. With `keep`, it
 * changes the size or length of the design already open, keeping every component: a
 * length too short for them is refused with an explanation, never trimmed.
 */
export default function ChooseSizeScreen() {
  const { t } = useTranslation();
  const { categoryId, keep } = useLocalSearchParams<{ categoryId: string; keep?: string }>();
  const ui = useUI();
  const design = useDesignStore();
  const editing = !!keep;
  const current = editing ? design.selectedSize : null;
  const [selectedId, setSelectedId] = useState<string | null>(current?.id ?? null);
  const [lengthMm, setLengthMm] = useState<number | null>(selectedLengthMm(current));
  const opening = useRef(false);
  const result = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId ?? '', { skip: !categoryId }));
  const category = result.data?.isActive ? result.data : undefined;
  const selectedSize = category?.sizes?.find(size => size.id === selectedId);
  const measured = !!category?.sizes?.length && category.sizes.every(isMeasuredSize);
  const piece = pieceOf(category ?? {});
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
    if (category && !category.sizes?.length && !editing) openBuilder();
  }, [category, openBuilder, editing]);

  // The components already on an open design, which a shorter length must still hold.
  const usedMm = editing ? usedLengthMm(design.items) : 0;
  const tooShort = editing && lengthMm !== null && !canFit(usedMm, 0, lengthMm);

  function chooseSize(size: CategorySize) {
    setSelectedId(size.id);
    // A new size starts at its default length; the same size keeps the chosen length.
    if (isMeasuredSize(size) && size.id !== selectedId) setLengthMm(size.defaultMeasurementMm);
  }

  function confirm() {
    if (!selectedSize) return;
    const chosen = isMeasuredSize(selectedSize) && lengthMm !== null
      ? { ...selectedSize, selectedMeasurementMm: lengthMm } : selectedSize;
    if (!editing) { openBuilder(chosen); return; }
    if (!useDesignStore.getState().resize(chosen)) return;
    if (router.canGoBack()) router.back(); else router.replace('/designer');
  }

  return <Page>
    <Header title={measured ? t(`${piece}.size.title`) : t('jewelry.chooseSize')} back />
    {result.loading || result.error ? <CatalogState {...result} error={result.error ?? ''} empty="" /> :
      category && (measured ? <>
        <Text style={ui.sectionTitle}>{category.name}</Text>
        <Text style={ui.body}>{t(`${piece}.size.subtitle`)}</Text>
        <View style={{ gap: 12 }} accessibilityRole="radiogroup">
          {category.sizes!.filter(isMeasuredSize).map(size => <SizeRangeOption key={size.id} piece={piece} size={size}
            selected={size.id === selectedId} onPress={() => chooseSize(size)} />)}
        </View>
        {selectedSize && isMeasuredSize(selectedSize) && lengthMm !== null ? <>
          <LengthSelector piece={piece} size={selectedSize} value={lengthMm} onChange={setLengthMm} />
          <LengthSummary piece={piece} size={selectedSize} value={lengthMm} />
        </> : <Text style={ui.caption}>{t('jewelry.selectSizeHint')}</Text>}
        {tooShort && lengthMm !== null && (
          <Text accessibilityRole="alert" style={ui.error}>
            {t(`${piece}.size.tooShortForDesign`, { used: cm(usedMm), length: cm(lengthMm) })}
          </Text>
        )}
        <Button title={editing ? t(`${piece}.size.apply`) : t(`${piece}.size.continue`)} icon="arrow-forward"
          disabled={!selectedSize || lengthMm === null || tooShort} onPress={confirm} />
      </> : <>
        <Text style={ui.sectionTitle}>{category.name}</Text>
        <Text style={ui.body}>{t('jewelry.compareSizes')}</Text>
        <View style={{ gap: 12 }}>
          {category.sizes?.map(size => <SizeOption key={size.id} size={size}
            selected={size.id === selectedId} onPress={() => chooseSize(size)} />)}
        </View>
        {selectedSize ? <SelectedSizeDetails size={selectedSize} /> : <Text style={ui.caption}>{t('jewelry.selectSizeHint')}</Text>}
        <Button title={t('jewelry.continueToBuilder')} icon="arrow-forward" disabled={!selectedSize}
          onPress={confirm} />
      </>)}
  </Page>;
}
