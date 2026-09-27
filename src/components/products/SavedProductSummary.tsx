import { Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { SavedProduct } from '@/services/commerceApi';
import { money } from '@/helper/pricing';
import { CatalogImage } from './CatalogImage';
export function SavedProductSummary({ product }: { product: SavedProduct }) {
  const ui = useUI();
  return (
    <View style={ui.card}>
      <View style={{ alignItems: 'center' }}>
        <CatalogImage imageUrl={product.designPreviewUrl ?? product.imageUrl}
          name={product.name} size={220} />
      </View>
      <Text style={ui.sectionTitle}>{product.name}</Text>
      {!!product.description && <Text style={ui.body}>{product.description}</Text>}
      {product.items.map((item) => (
        <Text key={item.id} style={ui.body}>
          {item.subCategory.name}: {item.quantity} × {money(item.unitPrice)} ={' '}
          {money(item.quantity * item.unitPrice)}
        </Text>
      ))}
      <Text style={ui.label}>Total beads: {product.itemCount}</Text>
      <Text style={ui.label}>Saved price: {money(product.price)}</Text>
    </View>
  );
}
