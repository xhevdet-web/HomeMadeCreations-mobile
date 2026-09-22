import { useTheme } from '@/hooks/useTheme';
import { Text, View } from 'react-native';
import { DesignItem } from '@/types/models';
import { designPrice, money, priceLines } from '@/helper/pricing';

import { useUI } from './ui';
export function PriceBreakdown({
  productName,
  basePrice,
  items,
  delivery,
}: {
  productName: string;
  basePrice: number;
  items: DesignItem[];
  delivery?: number;
}) {
  const theme = useTheme();
  const ui = useUI();

  return (
    <View style={{ gap: 14 }}>
      <View style={ui.between}>
        <Text style={ui.body}>{productName}</Text>
        <Text style={ui.label}>{money(basePrice)}</Text>
      </View>
      {priceLines(items).map((line) => (
        <View key={line.itemId} style={ui.between}>
          <Text style={[ui.caption, { flex: 1 }]}>
            {line.quantity} × {line.name}
          </Text>
          <Text style={ui.label}>{money(line.quantity * line.unitPrice)}</Text>
        </View>
      ))}
      {delivery !== undefined && (
        <View style={ui.between}>
          <Text style={ui.body}>Delivery</Text>
          <Text style={ui.label}>{money(delivery)}</Text>
        </View>
      )}
      <View style={ui.divider} />
      <View style={ui.between}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>Total</Text>
        <Text style={{ color: theme.colors.accent, fontSize: 23, fontWeight: '600' }}>
          {money(designPrice(basePrice, items) + (delivery ?? 0))}
        </Text>
      </View>
    </View>
  );
}
