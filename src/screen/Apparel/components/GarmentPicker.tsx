import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Garment, GarmentVariant } from '@/api/garmentModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { GarmentImage } from './GarmentImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

const inStock = (variants: GarmentVariant[]) => variants.some((variant) => variant.stock > 0);

/** Lowest price across a garment's variants, and its distinct colours. */
export function garmentSummary(garment: Garment) {
  const prices = garment.variants.map((variant) => variant.price ?? garment.basePrice);
  return {
    from: prices.length ? Math.min(...prices) : garment.basePrice,
    colours: [...new Map(garment.variants.map((variant) => [variant.colorValue, variant])).values()],
    soldOut: !inStock(garment.variants),
  };
}

/** One garment in the category grid: photo, name, from-price and colours. */
export function GarmentCard({ garment, width, onPress }: {
  garment: Garment;
  width: number;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { from, colours, soldOut } = garmentSummary(garment);
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={`${garment.name}, from ${money(from)}${soldOut ? ', sold out' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.cardPhoto, { height: width }]}>
        {garment.imageUrl ? (
          <CatalogImage imageUrl={garment.imageUrl} name={garment.name} size={width * 0.86} />
        ) : garment.frontImageUrl ? (
          <GarmentImage uri={garment.frontImageUrl} size={width * 0.86} />
        ) : (
          <CatalogImage imageUrl={null} name={garment.name} size={width * 0.6} />
        )}
        {soldOut && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>{garment.name}</Text>
        <Text style={styles.price}>from {money(from)}</Text>
        <View style={styles.dots}>
          {colours.slice(0, 6).map((variant) => (
            <View key={variant.colorValue} style={[styles.dot, { backgroundColor: variant.colorValue }]} />
          ))}
          {colours.length > 6 && <Text style={styles.more}>+{colours.length - 6}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

/** Colours of a garment; colours with no size in stock are shown sold out. */
export function ColourPicker({ variants, value, onChange }: {
  variants: GarmentVariant[];
  value: string | null;
  onChange: (colorValue: string) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const colours = [...new Map(variants.map((variant) => [variant.colorValue, variant])).values()];
  return (
    <View style={styles.wrap}>
      {colours.map((colour) => {
        const available = inStock(variants.filter((variant) => variant.colorValue === colour.colorValue));
        const active = colour.colorValue === value;
        return (
          <Pressable key={colour.colorValue} accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !available }}
            accessibilityLabel={`Colour ${colour.colorName}${available ? '' : ', sold out'}`}
            disabled={!available} onPress={() => onChange(colour.colorValue)}
            style={[styles.swatchRing, active && { borderColor: theme.colors.accent }, !available && { opacity: 0.4 }]}>
            <View style={[styles.swatch, { backgroundColor: colour.colorValue }]}>
              {!available && <View style={styles.slash} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Sizes for the chosen colour: sold-out sizes disabled, low stock flagged. */
export function SizePicker({ variants, value, onChange }: {
  variants: GarmentVariant[];
  value: string | null;
  onChange: (variant: GarmentVariant) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      {variants.map((variant) => {
        const active = variant.id === value;
        const soldOut = variant.stock < 1;
        return (
          <Pressable key={variant.id} accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: soldOut }}
            accessibilityLabel={`Size ${variant.size}${soldOut ? ', sold out' : variant.stock < 4 ? `, only ${variant.stock} left` : ''}`}
            disabled={soldOut} onPress={() => onChange(variant)}
            style={[styles.size, active && styles.sizeActive, soldOut && styles.sizeSoldOut]}>
            <Text style={[styles.sizeText, active && styles.sizeTextActive, soldOut && styles.strike]}>
              {variant.size}
            </Text>
            {!soldOut && variant.stock < 4 && (
              <Text style={[styles.low, active && styles.sizeTextActive]}>{variant.stock} left</Text>
            )}
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
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 16 },
    price: { color: c.gold, fontSize: 12, fontWeight: '600' },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: c.border },
    more: { color: c.muted, fontSize: 10 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatchRing: { padding: 3, borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
    swatch: {
      width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    slash: { width: 52, height: 2, backgroundColor: c.muted, transform: [{ rotate: '-45deg' }] },
    size: {
      minWidth: 58, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, alignItems: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    sizeActive: { backgroundColor: c.primary, borderColor: c.primary },
    sizeSoldOut: { backgroundColor: c.elevated, borderColor: c.elevated },
    sizeText: { color: c.text, fontSize: 14, fontWeight: '700' },
    sizeTextActive: { color: c.onPrimary },
    strike: { color: c.muted, textDecorationLine: 'line-through' },
    low: { color: c.danger, fontSize: 9, fontWeight: '600', marginTop: 1 },
  });
};
