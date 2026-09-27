import { Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { ApiOrder, orderStages } from '@/services/commerceApi';
import { money } from '@/helper/pricing';
import { CatalogImage } from './CatalogImage';
const statusLabels: Record<string, string> = {
  ORDERED: 'Ordered', CREATING: 'Being made', CREATED: 'Created',
  READY_FOR_COURIER: 'Ready for courier', PICKED_UP_BY_COURIER: 'With courier',
  COMPLETED: 'Completed',
};
export function OrderSummary({ order, progress = false }: { order: ApiOrder; progress?: boolean }) {
  const ui = useUI();
  const current = orderStages.findIndex((stage) => stage === order.status);
  return (
    <View style={ui.card}>
      <Text style={ui.sectionTitle}>{order.orderNumber}</Text>
      <View style={{ alignItems: 'center' }}>
        <CatalogImage imageUrl={order.product.designPreviewUrl ?? order.product.imageUrl}
          name={order.product.name} size={progress ? 260 : 140} />
      </View>
      <Text style={ui.label}>{order.product.name}</Text>
      <Text style={ui.label}>Total: {money(order.totalPrice)}</Text>
      <Text style={ui.body}>
        Payment:{' '}
        {order.paymentType === 'CASH_ON_DELIVERY'
          ? 'Cash on Delivery'
          : order.paymentType.replaceAll('_', ' ')}
      </Text>
      <Text style={ui.body}>Payment status: {order.paymentStatus}</Text>
      <Text style={ui.label}>Status: {statusLabels[order.status] ?? order.status}</Text>
      {progress && <Text style={ui.sectionTitle}>Components</Text>}
      {progress && order.product.items.map((item) => <Text key={item.id} style={ui.body}>
        {item.subCategory.name}: {item.quantity} × {money(item.unitPrice)}
      </Text>)}
      {progress && <Text style={ui.sectionTitle}>Delivery</Text>}
      {progress && <Text style={ui.caption}>
        {order.firstName} {order.lastName} · {order.phone}
      </Text>}
      {progress && <Text style={ui.caption}>
        {order.address}, {order.country} {order.postalCode ?? ''}
      </Text>}
      {progress &&
        orderStages.map((stage, index) => (
          <Text key={stage} style={index === current ? ui.label : ui.caption}>
            {index <= current ? '✓ ' : '○ '}
            {statusLabels[stage] ?? stage}
          </Text>
        ))}
    </View>
  );
}
