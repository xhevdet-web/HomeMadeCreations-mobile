import { Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { ApiOrder, orderStages } from '@/services/commerceApi';
import { money } from '@/helper/pricing';
export function OrderSummary({ order, progress = false }: { order: ApiOrder; progress?: boolean }) {
  const ui = useUI();
  const current = orderStages.findIndex((stage) => stage === order.status);
  return (
    <View style={ui.card}>
      <Text style={ui.sectionTitle}>{order.orderNumber}</Text>
      <Text style={ui.label}>{order.product.name}</Text>
      <Text style={ui.label}>Total: {money(order.totalPrice)}</Text>
      <Text style={ui.body}>
        Payment:{' '}
        {order.paymentType === 'CASH_ON_DELIVERY'
          ? 'Cash on Delivery'
          : order.paymentType.replaceAll('_', ' ')}
      </Text>
      <Text style={ui.body}>Payment status: {order.paymentStatus}</Text>
      <Text style={ui.label}>Status: {order.status}</Text>
      <Text style={ui.caption}>
        {order.firstName} {order.lastName} · {order.phone}
      </Text>
      <Text style={ui.caption}>
        {order.address}, {order.country} {order.postalCode ?? ''}
      </Text>
      {progress &&
        orderStages.map((stage, index) => (
          <Text key={stage} style={index === current ? ui.label : ui.caption}>
            {index <= current ? '✓ ' : '○ '}
            {stage}
          </Text>
        ))}
    </View>
  );
}
