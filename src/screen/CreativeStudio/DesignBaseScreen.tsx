import { useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useGetGiftPackagingQuery } from '@/api/endpoints/giftPackagingSlice';
import { packagingAvailable, type GiftPackaging, type PackagingChoice } from '@/api/packagingModels';
import { useCanvasStore } from '@/store/canvasStore';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import type { SavedProduct } from '@/api/commerceModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { openCanvasStudio } from '@/services/canvasDesign';
import { BaseCard } from '@/screen/Apparel/components/BasePicker';
import { GiftPackagingChooser } from './components/packaging/GiftPackagingChooser';

const GAP = 12;

const baseOf = (product: SavedProduct) =>
  ({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });

/**
 * Create your own bouquet or gift, before the studio opens. Bouquets choose the base product
 * to design on (e.g. "Wrapped Bouquet"); its photo becomes the canvas. Gifts choose their
 * packaging instead (transparent, or a closed box in its shape and color), which the studio
 * then draws. A gift category without packaging yet falls back to its base products, and
 * any category without either can still start on an empty canvas.
 */
export default function DesignBaseScreen() {
  const ui = useUI();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { categoryId = '', baseProductId, change } =
    useLocalSearchParams<{ categoryId: string; baseProductId?: string; change?: string }>();
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const data = category.data;
  const gift = data?.builderType === 'GIFT';
  const packaging = useApiResult<GiftPackaging[]>(useGetGiftPackagingQuery(undefined, { skip: !gift }));
  const packagingOffered = !!packaging.data?.some(packagingAvailable);
  // Gifts with packaging never need base products, so they aren't loaded.
  const bases = useApiResult<SavedProduct[]>(useGetProductsQuery({ categoryId, origin: 'COMPANY' },
    { skip: !data || (gift && (!packaging.data || packagingOffered)) }));
  const draft = useCanvasStore();
  const opened = useRef(false);

  // "Customize" on a product page arrives with its base already chosen.
  useEffect(() => {
    if (gift) return;
    const chosen = bases.data?.find((entry) => entry.id === baseProductId);
    if (!data || !chosen || opened.current) return;
    opened.current = true;
    openCanvasStudio(data, baseOf(chosen), true);
  }, [gift, data, bases.data, baseProductId]);

  if (data && gift && packagingOffered) {
    const sameGift = draft.categoryId === data.id;
    /** Opens the studio on this packaging; "Change" from the studio goes back to it, items kept. */
    const start = (choice: PackagingChoice) => {
      if (change && sameGift && router.canGoBack()) {
        useCanvasStore.getState().start({ builderType: 'GIFT', categoryId: data.id, categoryName: data.name,
          base: draft.base, packaging: choice });
        router.back();
      } else openCanvasStudio(data, sameGift ? draft.base : null, false, choice);
    };
    return (
      <Page style={{ gap: 18 }}>
        <Header title={t('giftStudio.packaging.screenTitle')} subtitle={data.name} back />
        <View style={{ gap: 4 }}>
          <Text style={styles.title}>{t('giftStudio.packaging.heading')}</Text>
          <Text style={ui.body}>{t('giftStudio.packaging.intro')}</Text>
        </View>
        <GiftPackagingChooser list={packaging.data ?? []} current={sameGift ? draft.packaging : null}
          onStart={start} />
      </Page>
    );
  }

  if (!data || packaging.loading || packaging.error || bases.loading || bases.error)
    return (
      <Page>
        <Header title={t('designBase.title')} back />
        <CatalogState loading={category.loading || packaging.loading || bases.loading}
          error={category.error || packaging.error || bases.error}
          empty={t('category.unavailable')} retry={() => { category.retry(); packaging.retry(); bases.retry(); }} />
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
