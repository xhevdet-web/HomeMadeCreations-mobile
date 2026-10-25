import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedProduct } from '@/api/commerceModels';
import { inStock, type SizeStock } from '@/api/apparelModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

const LOW_STOCK = 4;

/** One company product to design on: photo, name, colour and price. */
export function BaseCard({ product, width, selected = false, onPress }: {
  product: SavedProduct;
  width: number;
  selected?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const soldOut = !inStock(product);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: soldOut }}
      accessibilityLabel={`${product.name}, ${money(product.price)}${soldOut ? ', sold out' : ''}`}
      disabled={soldOut} onPress={onPress}
      style={({ pressed }) => [styles.card, { width, transform: [{ scale: pressed ? 0.98 : 1 }] },
        selected && { borderColor: theme.colors.accent, borderWidth: 2 }, soldOut && { opacity: 0.55 }]}>
      <View style={[styles.cardPhoto, { height: width }]}>
        <CatalogImage imageUrl={product.imageUrl} name={product.name} size={width * 0.86} />
        {soldOut && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        )}
        {selected && (
          <View style={[styles.check, { backgroundColor: theme.colors.accent }]}>
            <Icon name="checkmark" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={styles.meta}>
          {!!product.colorHex && <View style={[styles.dot, { backgroundColor: product.colorHex }]} />}
          {!!product.color && <Text style={styles.colour} numberOfLines={1}>{product.color}</Text>}
        </View>
        <Text style={styles.price}>{money(product.price)}</Text>
      </View>
    </Pressable>
  );
}

/** Sizes of a product with what is available: sold-out sizes disabled, low stock flagged. */
export function SizePicker({ sizes, value, onChange }: {
  sizes: SizeStock[];
  value: string | null;
  onChange: (size: string) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sizes}>
      {sizes.map((entry) => {
        const active = entry.size === value;
        const soldOut = entry.stock < 1;
        return (
          <Pressable key={entry.size} accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: soldOut }}
            accessibilityLabel={`Size ${entry.size}, ${soldOut ? 'sold out' : `${entry.stock} available`}`}
            disabled={soldOut} onPress={() => onChange(entry.size)}
            style={[styles.size, active && styles.sizeActive, soldOut && styles.sizeSoldOut]}>
            <Text style={[styles.sizeText, active && styles.sizeTextActive, soldOut && styles.strike]}>
              {entry.size}
            </Text>
            <Text style={[styles.available, active && styles.sizeTextActive,
              !soldOut && entry.stock < LOW_STOCK && !active && styles.low]}>
              {soldOut ? 'Sold out' : `${entry.stock} available`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    cardPhoto: { backgroundColor: c.thumbnail, alignItems: 'center', justifyContent: 'center' },
    cardBody: { padding: 12, gap: 3 },
    soldOut: {
      position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, paddingVertical: 3,
      borderRadius: 9, backgroundColor: c.danger,
    },
    soldOutText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    check: {
      position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 16 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 14 },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: c.border },
    colour: { color: c.muted, fontSize: 11, flexShrink: 1 },
    price: { color: c.gold, fontSize: 14, fontWeight: '700', marginTop: 2 },
    sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    size: {
      minWidth: 76, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, gap: 2,
    },
    sizeActive: { backgroundColor: c.primary, borderColor: c.primary },
    sizeSoldOut: { backgroundColor: c.elevated, borderColor: c.elevated },
    sizeText: { color: c.text, fontSize: 15, fontWeight: '700' },
    sizeTextActive: { color: c.onPrimary },
    strike: { color: c.muted, textDecorationLine: 'line-through' },
    available: { color: c.muted, fontSize: 10, fontWeight: '600' },
    low: { color: c.danger },
  });
};
