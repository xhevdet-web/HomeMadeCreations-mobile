import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { CatalogCategory } from '@/api/catalogModels';

function sizeRange(category: CatalogCategory) {
  const sizes = category.sizes ?? [];
  if (!sizes.length) return 'Free design';
  const values = sizes.map((size) => size.measurement);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const unit = sizes[0].unit;
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}

export function CategoryTile({ category, width, onPress }: {
  category: CatalogCategory;
  width: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const sizeCount = category.sizes?.length ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View style={[styles.imageArea, { height: width * 0.92 }]}>
        <CatalogImage imageUrl={category.imageUrl} name={category.name} size={width * 0.72} />
        {sizeCount > 0 && (
          <View style={styles.badge}>
            <Icon name="resize-outline" size={11} color={theme.colors.text} />
            <Text style={styles.badgeText}>
              {sizeCount} {sizeCount === 1 ? 'size' : 'sizes'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {category.description || 'Design it your way, bead by bead.'}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.meta} numberOfLines={1}>{sizeRange(category)}</Text>
          <View style={styles.arrow}>
            <Icon name="arrow-forward" size={15} color={theme.colors.onPrimary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function CategoryTileSkeleton({ width }: { width: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, { width }]} accessibilityElementsHidden>
      <View style={[styles.imageArea, styles.skeleton, { height: width * 0.92 }]} />
      <View style={styles.body}>
        <View style={[styles.skeleton, styles.line, { width: '60%', height: 16 }]} />
        <View style={[styles.skeleton, styles.line, { width: '90%' }]} />
        <View style={[styles.skeleton, styles.line, { width: '40%' }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      overflow: 'hidden',
    },
    imageArea: {
      backgroundColor: c.thumbnail,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: c.badge,
    },
    badgeText: { color: c.text, fontSize: 10, fontWeight: '600' },
    body: { padding: 12, gap: 4 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18 },
    description: { color: c.muted, fontSize: 11, lineHeight: 16, minHeight: 32 },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 6,
    },
    meta: { flex: 1, color: c.accent, fontSize: 11, fontWeight: '600' },
    arrow: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skeleton: { backgroundColor: c.elevated },
    line: { height: 10, borderRadius: 5, marginTop: 4 },
  });
};
