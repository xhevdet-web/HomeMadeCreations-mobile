import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Chips, Field, Header, Page, useUI } from '@/components/common/ui';
import { ProductCard } from '@/components/products/ProductCard';
import { useGetAllProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import { CatalogState } from '@/components/products/CatalogState';
import type { Product } from '@/types/models';

export default function ProductsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [filter, setFilter] = useState(
    category === 'Bracelets' || category === 'Necklaces' ? category : 'All',
  );
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const ui = useUI();
  const { t } = useTranslation();
  // Filter values stay English internally; only their labels are translated.
  const filters = { All: t('legacy.filterAll'), Bracelets: t('legacy.filterBracelets'), Necklaces: t('legacy.filterNecklaces') };
  const result = useApiResult<Product[]>(useGetAllProductsQuery());
  const visible = (result.data ?? []).filter(
    (product) =>
      (filter === 'All' || product.type === (filter === 'Bracelets' ? 'bracelet' : 'necklace')) &&
      product.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Page>
      <Header title={category ?? t('legacy.collection')} back />
      <Field
        label={t('legacy.searchLabel')}
        icon="search-outline"
        placeholder={t('legacy.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
      />
      <Chips options={Object.values(filters)} value={filters[filter as keyof typeof filters]}
        onChange={(label) => setFilter(Object.keys(filters).find((key) => filters[key as keyof typeof filters] === label) ?? 'All')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} width={(Math.min(width, 760) - 58) / 2} />
        ))}
      </View>
      {(result.loading || result.error) && <CatalogState {...result} error={result.error ?? ''} empty={t('legacy.noProducts')} />}
      {!result.loading && !result.error && !visible.length && (
        <Text style={ui.body}>{t('legacy.noMatch')}</Text>
      )}
    </Page>
  );
}
