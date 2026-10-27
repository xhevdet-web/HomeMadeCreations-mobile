import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedProduct } from '@/api/commerceModels';
import { inStock, isSized, parseSizes } from '@/api/apparelModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

/** A company product in a category grid: photo, name, colour or sizes, and price. */
export function CategoryProductCard({ product, width, onPress }: {
  product: SavedProduct;
  width: number;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const soldOut = !inStock(product);
  const sizes = parseSizes(product.sizes);
  const detail = [product.color, isSized(product) ? sizes.map((entry) => entry.size).join(' · ') : null]
    .filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={t(soldOut ? 'category.soldOutLabel' : 'category.productLabel', { name: product.name, price: money(product.price) })}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.photo, { height: width }]}>
        <CatalogImage imageUrl={product.imageUrl} name={product.name} size={width * 0.86} />
        {soldOut && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('category.soldOut')}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={styles.meta}>
          {!!product.colorHex && <View style={[styles.dot, { backgroundColor: product.colorHex }]} />}
          {!!detail && <Text style={styles.detail} numberOfLines={1}>{detail}</Text>}
        </View>
        <Text style={styles.price}>{money(product.price)}</Text>
      </View>
    </Pressable>
  );
}

export function CategoryProductSkeleton({ width }: { width: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, { width }]} accessibilityElementsHidden>
      <View style={[styles.photo, styles.skeleton, { height: width }]} />
      <View style={styles.body}>
        <View style={[styles.skeleton, { height: 14, width: '70%', borderRadius: 7 }]} />
        <View style={[styles.skeleton, { height: 10, width: '40%', borderRadius: 5 }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    photo: { backgroundColor: c.thumbnail, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, paddingVertical: 3,
      borderRadius: 9, backgroundColor: c.danger,
    },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    body: { padding: 12, gap: 3 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 16 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 14 },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: c.border },
    detail: { color: c.muted, fontSize: 11, flexShrink: 1 },
    price: { color: c.gold, fontSize: 15, fontWeight: '700', marginTop: 2 },
    skeleton: { backgroundColor: c.elevated },
  });
};
