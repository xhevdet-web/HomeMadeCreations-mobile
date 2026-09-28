import { useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, SectionTitle, useUI } from '@/components/common/ui';
import { SavedProduct } from '@/services/commerceApi';
import { useTheme } from '@/hooks/useTheme';
import { useRemote } from '@/hooks/useRemote';
import { fetchReadyMadeProducts, readyMadeUnavailable } from '@/services/catalogApi';
import { money } from '@/helper/pricing';
import { CatalogImage } from './CatalogImage';
import { CatalogState } from './CatalogState';
import { ProductImagePreview } from './ProductImagePreview';

export function ReadyMadeCollection({ search }: { search: string }) {
  const ui = useUI();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState<SavedProduct | null>(null);
  const result = useRemote(fetchReadyMadeProducts);
  const products = (result.data ?? []).filter(product =>
    product.stock !== 0 && product.name.toLowerCase().includes(search.trim().toLowerCase()));
  const cardWidth = Math.min(210, Math.min(width, 760) - 72);
  return <>
    <SectionTitle title="Ready to be yours" eyebrow="READY-MADE COLLECTION" />
    {result.loading || result.error || !products.length ?
      <CatalogState {...result} error={result.error ?? ''}
        empty={search ? 'No products match your search.' : 'No ready-made products are available yet.'} /> :
      <View style={{ gap: 10 }}>
      <FlatList
        horizontal
        data={products}
        keyExtractor={product => product.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 14}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
        renderItem={({ item: product }) => <View style={[ui.card, { width: cardWidth, padding: 12, gap: 10 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${product.name} image`}
            onPress={() => setPreview(product)} style={({ pressed }) => ({ gap: 10, opacity: pressed ? 0.7 : 1 })}>
          <CatalogImage imageUrl={product.designPreviewUrl ?? product.imageUrl}
            name={product.name} size={Math.max(40, cardWidth - 26)} />
          <Text numberOfLines={2} style={[ui.sectionTitle, { fontSize: 18 }]}>{product.name}</Text>
          <View style={[ui.between, { alignItems: 'baseline', gap: 8 }]}>
            <Text style={[ui.label, { flexShrink: 0 }]}>{money(product.price)}</Text>
            <Text style={[ui.caption, { flexShrink: 1, textAlign: 'right' },
              typeof product.stock === 'number' && product.stock > 0 && product.stock < 3 &&
                { color: theme.colors.danger }]}>
              {readyMadeUnavailable(product) ?? `${product.stock} available`}
            </Text>
          </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Order ${product.name}`}
            onPress={() => router.push({ pathname: '/details', params: { id: product.id, purchase: 'ready-made' } })}
            style={({ pressed }) => [ui.button, { minHeight: 44, paddingVertical: 10, paddingHorizontal: 12, opacity: pressed ? 0.75 : 1 }]}>
            <Text style={ui.buttonText}>Order</Text>
            <Icon name="arrow-forward" size={16} color={theme.colors.onPrimary} />
          </Pressable>
        </View>}
      />
      {products.length > 1 && <Text style={ui.caption}>Swipe to explore more creations</Text>}
      </View>}
    <ProductImagePreview product={preview} onClose={() => setPreview(null)} />
  </>;
}
