import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { CatalogCategory } from '@/api/catalogModels';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { isMeasuredSize } from '@/helper/jewelry';
import { parseStickerSize } from '@/helper/stickers';

function sizeRange(t: TFunction, category: CatalogCategory) {
  // Garments have their own colours and sizes, chosen on the next screen.
  if (category.builderType === 'APPAREL') return t('categories.designYourOwn');
  const sizes = category.sizes ?? [];
  if (!sizes.length) return t('categories.freeDesign');
  // Bracelet sizes are length ranges in mm; sticker sizes are a width and height in mm;
  // older sizes carry one measurement each.
  const measured = sizes.filter(isMeasuredSize);
  const stickers = category.builderType === 'STICKER'
    ? sizes.flatMap((size) => parseStickerSize(size) ?? []) : [];
  const values = measured.length
    ? measured.flatMap((size) => [size.minMeasurementMm / 10, size.maxMeasurementMm / 10])
    : stickers.length
      ? stickers.flatMap((size) => [size.widthMm / 10, size.heightMm / 10])
      : sizes.map((size) => size.measurement ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const unit = measured.length || stickers.length ? 'cm' : sizes[0].unit;
  const range = min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
  return t('categories.sizes', { count: sizes.length, range });
}

/** One category as a grid card: a large picture first, so pieces are found at a glance. */
export function CategoryTile({ category, onPress }: {
  category: CatalogCategory;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('categories.browse', { name: category.name })}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.image}>
        <CatalogImage imageUrl={category.imageUrl} name={category.name} size={104} />
        <View style={styles.arrow} accessibilityElementsHidden>
          <Icon name="arrow-forward" size={14} color={theme.colors.text} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {category.description || t('categories.defaultDescription')}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>{sizeRange(t, category)}</Text>
      </View>
    </Pressable>
  );
}

export function CategoryTileSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card} accessibilityElementsHidden>
      <View style={[styles.image, styles.skeleton]} />
      <View style={styles.body}>
        <View style={[styles.skeleton, styles.line, { width: '65%', height: 14 }]} />
        <View style={[styles.skeleton, styles.line, { width: '90%' }]} />
        <View style={[styles.skeleton, styles.line, { width: '45%' }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      flex: 1,
      padding: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    image: {
      height: 128,
      borderRadius: 14,
      backgroundColor: c.thumbnail,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    arrow: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.badge,
    },
    body: { gap: 3, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 6 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 17 },
    description: { color: c.muted, fontSize: 12, lineHeight: 17 },
    meta: { color: c.accent, fontSize: 11, fontWeight: '600', marginTop: 3 },
    skeleton: { backgroundColor: c.elevated },
    line: { height: 10, borderRadius: 5, marginTop: 4 },
  });
};
