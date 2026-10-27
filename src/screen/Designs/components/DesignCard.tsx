import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { componentCount } from '@/helper/builders';
import { Icon, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { SavedProduct } from '@/api/commerceModels';
import { apparelImage, apparelMeta, isApparelProduct } from '@/services/apparelDesign';

const VISIBLE_MATERIALS = 3;

// Saved designs store consecutive runs; customers think in totals per bead.
function materials(product: SavedProduct) {
  const totals = new Map<string, { name: string; imageUrl?: string | null; quantity: number }>();
  for (const item of product.items) {
    const entry = totals.get(item.subCategoryId);
    if (entry) entry.quantity += item.quantity;
    else
      totals.set(item.subCategoryId, {
        name: item.subCategory.name,
        imageUrl: item.subCategory.imageUrl,
        quantity: item.quantity,
      });
  }
  return [...totals.values()];
}

export function DesignCard({
  product,
  editing,
  disabled,
  onOrder,
  onEdit,
}: {
  product: SavedProduct;
  editing: boolean;
  disabled: boolean;
  onOrder: () => void;
  onEdit: () => void;
}) {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const readyMade = product.origin === 'COMPANY';
  const lines = readyMade ? [] : materials(product);
  const size = product.selectedSize;
  const apparel = !readyMade && isApparelProduct(product);
  const meta = (apparel
    ? apparelMeta(t, product)
    : [
      readyMade ? t('designs.readyMade') : componentCount(t, product.itemCount, product.category?.builderType),
      size ? `${size.name} · ${size.measurement} ${size.unit}` : product.category?.name,
    ]).filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.thumbnail}>
          <CatalogImage
            imageUrl={apparelImage(product)}
            name={product.name}
            size={88}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          {!!meta && <Text style={ui.caption} numberOfLines={1}>{meta}</Text>}
          <Text style={styles.price}>{money(product.price)}</Text>
        </View>
      </View>

      {!!product.description && (
        <Text style={ui.caption} numberOfLines={2}>{product.description}</Text>
      )}

      {lines.length > 0 && (
        <View style={styles.chips}>
          {lines.slice(0, VISIBLE_MATERIALS).map((line) => (
            <View key={line.name} style={styles.chip}>
              <CatalogImage imageUrl={line.imageUrl} name={line.name} size={16} />
              <Text style={styles.chipText} numberOfLines={1}>
                {line.name} ×{line.quantity}
              </Text>
            </View>
          ))}
          {lines.length > VISIBLE_MATERIALS && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{t('designs.more', { count: lines.length - VISIBLE_MATERIALS })}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        {!readyMade ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('designs.editCopyOf', { name: product.name })}
            accessibilityState={{ disabled, busy: editing }}
            disabled={disabled}
            onPress={onEdit}
            hitSlop={8}
            style={({ pressed }) => [styles.edit, { opacity: disabled && !editing ? 0.4 : pressed ? 0.6 : 1 }]}
          >
            {editing ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <Icon name="create-outline" size={17} color={theme.colors.accent} />
            )}
            <Text style={styles.editText}>{t('designs.editCopy')}</Text>
          </Pressable>
        ) : <View />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('designs.orderName', { name: product.name })}
          disabled={disabled}
          onPress={onOrder}
          style={({ pressed }) => [styles.order, { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 }]}
        >
          <Text style={styles.orderText}>{t('designs.order')}</Text>
          <Icon name="arrow-forward" size={16} color={theme.colors.onPrimary} />
        </Pressable>
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
      borderRadius: 18,
      padding: 14,
      gap: 12,
    },
    top: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    thumbnail: {
      width: 96,
      height: 96,
      borderRadius: 14,
      backgroundColor: c.thumbnail,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    info: { flex: 1, gap: 4 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 19, lineHeight: 24 },
    price: { color: c.gold, fontSize: 16, fontWeight: '600', marginTop: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '100%',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: c.soft,
    },
    chipText: { color: c.muted, fontSize: 11, flexShrink: 1 },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 12,
    },
    edit: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
    editText: { color: c.accent, fontSize: 13, fontWeight: '600' },
    order: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 40,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    orderText: { color: c.onPrimary, fontSize: 13, fontWeight: '600' },
  });
};
