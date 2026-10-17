import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme } from '@/hooks/useTheme';
import { OrderedProduct, SavedProduct } from '@/api/commerceModels';

export function ProductOverview({
  product,
  action,
}: {
  product: OrderedProduct | SavedProduct;
  action?: ReactNode;
}) {
  const ui = useUI();
  const theme = useTheme();
  const size = 'selectedSize' in product ? product.selectedSize : undefined;
  return (
    <View style={[ui.card, { padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{ backgroundColor: theme.colors.thumbnail, borderRadius: 16, overflow: 'hidden' }}
        >
          <CatalogImage
            imageUrl={product.designPreviewUrl ?? product.imageUrl}
            name={product.name}
            size={80}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[ui.sectionTitle, { fontSize: 22 }]}>{product.name}</Text>
          <Text style={ui.caption}>
            {product.productType === 'READY_MADE'
              ? 'Ready-made jewelry'
              : `${product.itemCount} beads · Custom design`}
          </Text>
          {size && (
            <Text style={ui.caption}>
              {size.name} · {size.measurement} {size.unit}
            </Text>
          )}
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
