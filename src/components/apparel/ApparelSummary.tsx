import { StyleSheet, Text, View } from 'react-native';
import { CatalogImage } from '@/components/products/CatalogImage';
import { DetailRow } from '@/components/checkout/ProductOverview';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { OrderedProduct } from '@/api/commerceModels';
import { apparelImage } from '@/services/apparelDesign';

/** Front/back previews, the base piece, its size and the placed designs of a custom garment. */
export function ApparelSummary({ product }: { product: OrderedProduct }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const piece = product.baseProduct;
  const size = product.selectedSize?.name;
  const options = [
    ...(piece ? [{ key: 'piece', name: t('apparelSummary.piece'), value: piece.name, swatch: undefined }] : []),
    ...(piece?.color ? [{ key: 'colour', name: t('apparelSummary.colour'), value: piece.color, swatch: piece.colorHex ?? undefined }] : []),
    ...(size ? [{ key: 'size', name: t('apparelSummary.size'), value: size, swatch: undefined }] : []),
  ];
  const designs = (product.items ?? []).map((item) => ({
    id: item.id,
    name: item.subCategory.name,
    side: item.side === 'BACK' ? t('apparelSummary.back') : t('apparelSummary.front'),
    price: item.unitPrice * item.quantity,
  }));
  const base = product.basePrice ?? Math.max(product.price - designs.reduce((sum, d) => sum + d.price, 0), 0);
  const previews = [
    { label: product.designPreviewUrl ? t('apparelSummary.front') : t('apparelSummary.yourPiece'), url: apparelImage(product) },
    ...(product.backDesignPreviewUrl ? [{ label: t('apparelSummary.back'), url: product.backDesignPreviewUrl }] : []),
  ];
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.previews}>
        {previews.map((preview) => (
          <View key={preview.label} style={styles.preview}>
            <View style={styles.image}>
              <CatalogImage imageUrl={preview.url} name={t('apparelSummary.imageOf', { name: product.name, view: preview.label })} size={140} />
            </View>
            <Text style={styles.previewLabel}>{preview.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
      {options.length > 0 && (
        <View style={styles.card}>
          {options.map((option) => (
            <View key={option.key} style={styles.optionRow}>
              <Text style={styles.muted}>{option.name}</Text>
              <View style={styles.optionValue}>
                {option.swatch && <View style={[styles.swatch, { backgroundColor: String(option.swatch) }]} />}
                <Text style={styles.strong}>{option.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.title}>{t('apparelSummary.designs')}</Text>
        {designs.map((design) => (
          <DetailRow key={design.id} label={t('apparelSummary.designOnSide', { name: design.name, side: design.side })} value={money(design.price)} />
        ))}
        <View style={styles.divider} />
        <DetailRow label={piece ? [piece.name, size].filter(Boolean).join(' · ')
          : product.category?.name ?? t('apparelSummary.garment')} value={money(base)} />
        <DetailRow label={t('common.total')} value={money(product.price)} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    previews: { flexDirection: 'row', gap: 12 },
    preview: { flex: 1, gap: 6, alignItems: 'center' },
    image: {
      width: '100%', aspectRatio: 1, borderRadius: 18, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    previewLabel: { color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
    card: {
      gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18 },
    optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: c.border },
    muted: { color: c.muted, fontSize: 13 },
    strong: { color: c.text, fontSize: 13, fontWeight: '600' },
    divider: { height: 1, backgroundColor: c.border },
  });
};
