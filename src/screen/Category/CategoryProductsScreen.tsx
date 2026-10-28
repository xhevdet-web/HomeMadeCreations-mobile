import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetCreationsFromOthersQuery, useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import type { CommunityCreation, SavedProduct } from '@/api/commerceModels';
import { CommunityCreations } from '@/screen/Home/components/ForYou';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { startDesign } from '@/services/categoryFlow';
import { CreateOwnCard } from './components/CreateOwnCard';
import { CategoryProductCard, CategoryProductSkeleton } from './components/CategoryProductCard';

const GAP = 12;

/**
 * A category: its header, the prominent "Create your own design" entry to the matching
 * Creative Studio, then the company products to explore and order as they are.
 */
export default function CategoryProductsScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { categoryId = '' } = useLocalSearchParams<{ categoryId: string }>();
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  // Only this category's catalog is requested; the API filters it.
  const products = useApiResult<SavedProduct[]>(
    useGetProductsQuery({ categoryId, origin: 'COMPANY' }, { skip: !categoryId }));
  // Finished designs of other customers in this category (never the current user's).
  const creations = useApiResult<CommunityCreation[]>(
    useGetCreationsFromOthersQuery({ categoryId }, { skip: !categoryId }));
  const data = category.data;
  const tileWidth = (Math.min(width, 760) - 44 - GAP) / 2;

  if (!data)
    return (
      <Page>
        <Header title={t('category.collection')} back />
        <CatalogState loading={category.loading} error={category.error}
          empty={t('category.unavailable')} retry={category.retry} />
      </Page>
    );

  return (
    <Page style={{ gap: 20 }}>
      <Header title="" back />
      <View style={{ gap: 6 }}>
        <Text style={ui.eyebrow}>{t('category.eyebrow')}</Text>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={ui.body}>{data.description || t('category.defaultDescription')}</Text>
      </View>

      <CreateOwnCard category={data} onPress={() => startDesign(data)} />

      <View style={{ gap: 14 }}>
        <View style={ui.between}>
          <Text style={styles.heading}>{t('category.explore', { name: data.name })}</Text>
          {!!products.data?.length && (
            <Text style={ui.caption}>
              {t('counts.product', { count: products.data.length })}
            </Text>
          )}
        </View>
        {products.loading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((index) => <CategoryProductSkeleton key={index} width={tileWidth} />)}
          </View>
        ) : products.error ? (
          <CatalogState loading={false} error={products.error} retry={products.retry} empty="" />
        ) : !products.data?.length ? (
          <Text style={ui.body}>{t('category.noReadyMade', { name: data.name })}</Text>
        ) : (
          <View style={styles.grid}>
            {products.data.map((product) => (
              <CategoryProductCard key={product.id} product={product} width={tileWidth}
                onPress={() => router.push({ pathname: '/details', params: { id: product.id, purchase: 'ready-made' } })} />
            ))}
          </View>
        )}
      </View>

      <CommunityCreations
        title={t('community.byOthers', { category: data.name })}
        creations={creations.data ?? []}
        loading={creations.loading}
        error={creations.error}
        onRetry={creations.retry}
        hideWhenEmpty
        onOpen={(creation) => router.push({ pathname: '/creation',
          params: { id: creation.completedOrderId, collection: categoryId } })}
      />
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 34, lineHeight: 40 },
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 22 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  });
};
