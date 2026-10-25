import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, useUI } from '@/components/common/ui';
import { SavedProduct } from '@/api/commerceModels';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import { inStock, isSized } from '@/api/apparelModels';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { CatalogImage } from './CatalogImage';
import { CatalogState } from './CatalogState';
import { ProductImagePreview } from './ProductImagePreview';

const CARD_WIDTH = 172;
const GAP = 12;

function ReadyMadeCard({ product, onPreview }: { product: SavedProduct; onPreview: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(createStyles);
  // Sized products show their sizes on the details screen; here only "sold out" matters.
  const sized = isSized(product);
  const unavailable = inStock(product) ? null : 'Out of stock';
  const lowStock = !sized && typeof product.stock === 'number' && product.stock > 0 && product.stock < 3;
  const order = () =>
    router.push({ pathname: '/details', params: { id: product.id, purchase: 'ready-made' } });
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${product.name} image`}
        onPress={onPreview} style={({ pressed }) => [styles.imageArea, { opacity: pressed ? 0.85 : 1 }]}>
        <CatalogImage imageUrl={product.designPreviewUrl ?? product.imageUrl}
          name={product.name} size={CARD_WIDTH - 24} />
        {(lowStock || !!unavailable) && (
          <View style={[styles.badge, { backgroundColor: c.danger }]}>
            <Text style={styles.badgeText}>
              {unavailable ?? `Only ${product.stock} left`}
            </Text>
          </View>
        )}
        <View style={styles.zoom}>
          <Icon name="expand-outline" size={13} color={c.text} />
        </View>
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.stock} numberOfLines={1}>
          {unavailable ?? (sized ? product.color ?? 'Choose your size' : `${product.stock} available`)}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{money(product.price)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Order ${product.name}`}
            onPress={order} hitSlop={6}
            style={({ pressed }) => [styles.order, { opacity: pressed ? 0.75 : 1 }]}>
            <Icon name="bag-add-outline" size={16} color={c.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CardSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card} accessibilityElementsHidden>
      <View style={[styles.imageArea, styles.skeleton]} />
      <View style={styles.body}>
        <View style={[styles.skeleton, { height: 14, width: '70%', borderRadius: 7 }]} />
        <View style={[styles.skeleton, { height: 10, width: '45%', borderRadius: 5 }]} />
      </View>
    </View>
  );
}

export function ReadyMadeCollection({ search }: { search: string }) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const [preview, setPreview] = useState<SavedProduct | null>(null);
  // Active company products from every category (filtered by the API, shared with Home);
  // the search box only narrows this short rail by name.
  const result = useApiResult<SavedProduct[]>(useGetProductsQuery({ origin: 'COMPANY' }));
  const products = (result.data ?? []).filter((product) =>
    inStock(product) && product.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <View style={{ gap: 14 }}>
    <View style={ui.between}>
      <View style={{ flex: 1 }}>
        <Text style={ui.eyebrow}>READY-MADE COLLECTION</Text>
        <Text style={styles.heading}>Ready to be yours</Text>
      </View>
      {!!products.length && (
        <Text style={ui.caption}>
          {products.length} {products.length === 1 ? 'piece' : 'pieces'}
        </Text>
      )}
    </View>
    {result.loading ? (
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <CardSkeleton />
        <CardSkeleton />
      </View>
    ) : result.error || !products.length ? (
      <CatalogState {...result} error={result.error ?? ''}
        empty={search ? 'No products match your search.' : 'No ready-made products are available yet.'} />
    ) : (
      <FlatList
        horizontal
        data={products}
        keyExtractor={product => product.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        renderItem={({ item }) => <ReadyMadeCard product={item} onPreview={() => setPreview(item)} />}
      />
    )}
    <ProductImagePreview product={preview} onClose={() => setPreview(null)} />
  </View>;
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    card: {
      width: CARD_WIDTH, borderRadius: 20, overflow: 'hidden',
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    imageArea: {
      height: CARD_WIDTH, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center',
    },
    badge: {
      position: 'absolute', top: 10, left: 10, maxWidth: CARD_WIDTH - 54,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9,
    },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    zoom: {
      position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 13,
      backgroundColor: c.badge, alignItems: 'center', justifyContent: 'center',
    },
    body: { padding: 12, gap: 3 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 17 },
    stock: { color: c.muted, fontSize: 11 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    price: { color: c.gold, fontSize: 16, fontWeight: '700' },
    order: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    skeleton: { backgroundColor: c.elevated },
  });
};
