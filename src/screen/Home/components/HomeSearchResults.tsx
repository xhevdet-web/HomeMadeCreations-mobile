import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { ProductImagePreview } from '@/components/products/ProductImagePreview';
import { ReadyMadeCard } from '@/components/products/ReadyMadeCard';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { CatalogCategory } from '@/api/catalogModels';
import type { SavedProduct } from '@/api/commerceModels';
import { builderOf } from '../homeContent';
import { SectionHeader } from './SectionHeader';

/** What the header search finds: categories to create in, and ready-made pieces to buy. */
export function HomeSearchResults({ query, categories, products, onOpenCategory }: {
  query: string;
  categories: CatalogCategory[];
  products: SavedProduct[];
  onOpenCategory: (category: CatalogCategory) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [preview, setPreview] = useState<SavedProduct | null>(null);
  const term = query.trim().toLowerCase();
  const matchingCategories = categories.filter((category) => category.name.toLowerCase().includes(term));
  const matchingProducts = products.filter((product) =>
    [product.name, product.category?.name, product.color].some((text) => text?.toLowerCase().includes(term)));

  if (!matchingCategories.length && !matchingProducts.length)
    return (
      <View style={styles.empty} accessibilityLiveRegion="polite">
        <Icon name="search-outline" size={22} color={theme.colors.muted} />
        <Text style={styles.emptyText}>{t('home.searchNoMatch', { query: query.trim() })}</Text>
      </View>
    );

  return (
    <View style={{ gap: 24 }}>
      {matchingCategories.length > 0 && (
        <View style={{ gap: 10 }}>
          <SectionHeader title={t('home.searchCategories')} />
          {matchingCategories.map((category) => (
            <Pressable key={category.id} accessibilityRole="button"
              accessibilityLabel={`${category.name}: ${t(`home.createLabels.${builderOf(category)}`)}`}
              onPress={() => onOpenCategory(category)}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
              <View style={styles.rowImage}>
                <CatalogImage imageUrl={category.imageUrl} name={category.name} size={40} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{category.name}</Text>
                <Text style={styles.rowLine}>{t(`home.createLabels.${builderOf(category)}`)}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={theme.colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
      {matchingProducts.length > 0 && (
        <View style={{ gap: 14 }}>
          <SectionHeader title={t('counts.product', { count: matchingProducts.length })} />
          <FlatList horizontal data={matchingProducts} keyExtractor={(product) => product.id}
            showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => <ReadyMadeCard product={item} onPreview={() => setPreview(item)} />} />
        </View>
      )}
      <ProductImagePreview product={preview} onClose={() => setPreview(null)} />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    empty: {
      alignItems: 'center', gap: 10, padding: 22, borderRadius: 18,
      borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, backgroundColor: c.surface,
    },
    emptyText: { color: c.muted, fontSize: 13, textAlign: 'center' },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    rowImage: {
      width: 48, height: 48, borderRadius: 12, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    rowTitle: { color: c.text, fontSize: 15, fontWeight: '600' },
    rowLine: { color: c.accent, fontSize: 12 },
  });
};
