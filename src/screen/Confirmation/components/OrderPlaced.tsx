import { Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { DetailRow, ProductOverview } from '@/components/checkout/ProductOverview';
import { useTheme } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import type { ApiOrder } from '@/api/commerceModels';

export function OrderPlaced({ order }: { order: ApiOrder }) {
  const ui = useUI();
  const theme = useTheme();
  const paid = order.paymentStatus === 'PAID';
  const cashOnDelivery = order.paymentType === 'CASH_ON_DELIVERY';
  return (
    <>
      <View style={{ alignItems: 'center', gap: 14, paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkmark" size={36} color={theme.colors.onPrimary} />
        </View>
        <Text
          accessibilityRole="header"
          style={[ui.title, { textAlign: 'center', fontSize: 32, lineHeight: 39 }]}
        >
          {order.firstName ? 'Thank you, ' + order.firstName + '.' : 'Thank you for your order.'}
        </Text>
        <Text style={[ui.body, { textAlign: 'center' }]}>Your order has been placed.</Text>
      </View>
      <ProductOverview product={order.product} />
      <View style={ui.card}>
        <DetailRow label="Order number" value={order.orderNumber} />
        <DetailRow
          label={paid ? 'Paid' : cashOnDelivery ? 'Due on delivery' : 'Order total'}
          value={money(order.totalPrice)}
        />
        <Text style={ui.caption}>
          {cashOnDelivery && !paid ? 'Pay cash when your order arrives. ' : ''}You can follow its
          progress in My Orders.
        </Text>
      </View>
    </>
  );
}
