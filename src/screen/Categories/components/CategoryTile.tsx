import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { CatalogCategory } from '@/api/catalogModels';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

function sizeRange(t: TFunction, category: CatalogCategory) {
  // Garments have their own colours and sizes, chosen on the next screen.
  if (category.builderType === 'APPAREL') return t('categories.designYourOwn');
  const sizes = category.sizes ?? [];
  if (!sizes.length) return t('categories.freeDesign');
  const values = sizes.map((size) => size.measurement);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const unit = sizes[0].unit;
  const range = min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
  return t('categories.sizes', { count: sizes.length, range });
}

/** One category as a full-width row, like an order in My Orders. */
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
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.image}>
        <CatalogImage imageUrl={category.imageUrl} name={category.name} size={76} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {category.description || t('categories.defaultDescription')}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>{sizeRange(t, category)}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
    </Pressable>
  );
}

export function CategoryTileSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card} accessibilityElementsHidden>
      <View style={[styles.image, styles.skeleton]} />
      <View style={styles.body}>
        <View style={[styles.skeleton, styles.line, { width: '55%', height: 14 }]} />
        <View style={[styles.skeleton, styles.line, { width: '85%' }]} />
        <View style={[styles.skeleton, styles.line, { width: '35%' }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    image: {
      width: 84,
      height: 84,
      borderRadius: 14,
      backgroundColor: c.thumbnail,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    body: { flex: 1, gap: 4 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 19 },
    description: { color: c.muted, fontSize: 12, lineHeight: 17 },
    meta: { color: c.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },
    skeleton: { backgroundColor: c.elevated },
    line: { height: 10, borderRadius: 5, marginTop: 4 },
  });
};
