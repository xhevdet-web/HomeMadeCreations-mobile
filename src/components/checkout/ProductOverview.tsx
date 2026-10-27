import { ReactNode } from 'react';
import { componentCount } from '@/helper/builders';
import { Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { OrderedProduct, SavedProduct } from '@/api/commerceModels';
import { apparelImage, apparelMeta, isApparelProduct } from '@/services/apparelDesign';

export function ProductOverview({
  product,
  action,
  size: chosenSize,
}: {
  product: OrderedProduct | SavedProduct;
  action?: ReactNode;
  /** Size chosen at checkout for a company product sold in sizes. */
  size?: string | null;
}) {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const saved = product.selectedSize;
  const size = chosenSize
    ? t('productOverview.size', { size: chosenSize })
    : saved
      ? saved.measurement ? `${saved.name} · ${saved.measurement} ${saved.unit}` : t('productOverview.size', { size: saved.name })
      : null;
  return (
    <View style={[ui.card, { padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{ backgroundColor: theme.colors.thumbnail, borderRadius: 16, overflow: 'hidden' }}
        >
          <CatalogImage
            imageUrl={apparelImage(product)}
            name={product.name}
            size={80}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[ui.sectionTitle, { fontSize: 22 }]}>{product.name}</Text>
          <Text style={ui.caption}>
            {product.origin === 'COMPANY'
              ? [product.color, t('productOverview.readyToOrder')].filter(Boolean).join(' · ')
              : isApparelProduct(product)
                ? apparelMeta(t, product).join(' · ')
                : `${componentCount(t, product.itemCount, product.category?.builderType)} · ${t('productOverview.customDesign')}`}
          </Text>
          {size && <Text style={ui.caption}>{size}</Text>}
        </View>
      </View>
      {action && <View style={{ alignItems: 'flex-end' }}>{action}</View>}
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  const ui = useUI();
  return (
    <View style={[ui.between, { alignItems: 'flex-start' }]}>
      <Text style={[ui.caption, { flex: 1 }]}>{label}</Text>
      <Text style={[ui.label, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}
