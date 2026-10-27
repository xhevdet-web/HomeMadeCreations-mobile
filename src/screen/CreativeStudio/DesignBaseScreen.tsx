import { useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import type { SavedProduct } from '@/api/commerceModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { openCanvasStudio } from '@/services/canvasDesign';
import { BaseCard } from '@/screen/Apparel/components/BasePicker';

const GAP = 12;

const baseOf = (product: SavedProduct) =>
  ({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });

/**
 * Create your own bouquet or gift: first choose the base product to design on (e.g.
 * "Wrapped Bouquet", "Gift Box"). Its photo becomes the canvas; everything else is up to
 * the customer. A category without base products yet can still start on an empty canvas.
 */
export default function DesignBaseScreen() {
  const ui = useUI();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { categoryId = '', baseProductId } = useLocalSearchParams<{ categoryId: string; baseProductId?: string }>();
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const bases = useApiResult<SavedProduct[]>(
    useGetProductsQuery({ categoryId, origin: 'COMPANY' }, { skip: !categoryId }));
  const opened = useRef(false);
  const data = category.data;

  // "Customize" on a product page arrives with its base already chosen.
  useEffect(() => {
    const chosen = bases.data?.find((entry) => entry.id === baseProductId);
    if (!data || !chosen || opened.current) return;
    opened.current = true;
    openCanvasStudio(data, baseOf(chosen), true);
  }, [data, bases.data, baseProductId]);

  if (!data || bases.loading || bases.error)
    return (
      <Page>
        <Header title={t('designBase.title')} back />
        <CatalogState loading={category.loading || bases.loading} error={category.error || bases.error}
          empty={t('category.unavailable')} retry={bases.retry} />
      </Page>
    );

  const tileWidth = (Math.min(width, 760) - 44 - GAP) / 2;
  const products = bases.data ?? [];
  const builder = data.builderType === 'GIFT' ? 'GIFT' : 'BOUQUET';
  return (
    <Page style={{ gap: 18 }}>
      <Header title={t('designBase.title')} subtitle={data.name} back />
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>{t('designBase.heading')}</Text>
        <Text style={ui.body}>
          {t(`designBase.intro${builder}`)}
        </Text>
      </View>
      {products.length ? (
        <View style={styles.grid}>
          {products.map((product) => (
            <BaseCard key={product.id} product={product} width={tileWidth}
              onPress={() => openCanvasStudio(data, baseOf(product))} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={ui.body}>
            {t(`designBase.empty${builder}`)}
          </Text>
          <Button title={t('designBase.emptyCanvas')} icon="color-palette-outline"
            onPress={() => openCanvasStudio(data, null)} />
        </View>
      )}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 32 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    empty: {
      gap: 14, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
  });
};
