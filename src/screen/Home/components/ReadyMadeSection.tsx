import { useState } from 'react';
import { FlatList, View } from 'react-native';
import type { SavedProduct } from '@/api/commerceModels';
import { CARD_WIDTH, ReadyMadeCard, ReadyMadeSkeleton } from '@/components/products/ReadyMadeCard';
import { ProductImagePreview } from '@/components/products/ProductImagePreview';
import { SectionHeader, SectionRetry } from './SectionHeader';

const GAP = 12;

/** "Made by HomeMade": company products ready to order, as opposed to creating your own. */
export function ReadyMadeSection({ products, loading, error, onRetry, onSeeAll }: {
  /** Already in stock and balanced across categories. */
  products: SavedProduct[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSeeAll: () => void;
}) {
  const [preview, setPreview] = useState<SavedProduct | null>(null);
  if (!loading && !error && !products.length) return null;
  return (
    <View style={{ gap: 14 }}>
      <SectionHeader eyebrow="READY-MADE" title="Made by HomeMade"
        subtitle="Beautiful pieces, ready to order." action="See all" onAction={onSeeAll} />
      {error ? <SectionRetry what="ready-made pieces" onRetry={onRetry} /> : loading ? (
        <View style={{ flexDirection: 'row', gap: GAP }}>
          <ReadyMadeSkeleton />
          <ReadyMadeSkeleton />
        </View>
      ) : (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(product) => product.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          initialNumToRender={3}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          renderItem={({ item }) => <ReadyMadeCard product={item} onPreview={() => setPreview(item)} />}
        />
      )}
      <ProductImagePreview product={preview} onClose={() => setPreview(null)} />
    </View>
  );
}
