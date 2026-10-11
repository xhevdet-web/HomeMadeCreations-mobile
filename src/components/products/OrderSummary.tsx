import { Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { DetailRow, Disclosure, ProductOverview } from '@/components/checkout/Flow';
import { ApiOrder, orderStages } from '@/services/commerceApi';
import { money } from '@/helper/pricing';
import { useTheme } from '@/hooks/useTheme';
import { CatalogImage } from './CatalogImage';

const statusLabels: Record<string, string> = {
  ORDERED: 'Ordered',
  CREATING: 'Being made',
  CREATED: 'Created',
  READY_FOR_COURIER: 'Ready for courier',
  PICKED_UP_BY_COURIER: 'With courier',
  COMPLETED: 'Completed',
};
export function OrderSummary({ order, progress = false }: { order: ApiOrder; progress?: boolean }) {
  const ui = useUI();
  const theme = useTheme();
  const current = orderStages.findIndex((stage) => stage === order.status);
  const status = statusLabels[order.status] ?? order.status.replaceAll('_', ' ').toLowerCase();
  const payment =
    order.paymentType === 'CASH_ON_DELIVERY'
      ? 'Cash on Delivery'
      : order.paymentType.replaceAll('_', ' ').toLowerCase();
  const paid = order.paymentStatus === 'PAID';
  if (progress)
    return (
      <>
        <View style={{ gap: 8 }}>
          <Text style={ui.sectionTitle}>{order.orderNumber}</Text>
          <Text style={ui.body}>Status: {status}</Text>
        </View>
        <ProductOverview product={order.product} />
        <View style={ui.card}>
          <Text style={ui.label}>Your order’s journey</Text>
          {orderStages.map((stage, index) => (
            <View key={stage} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: index <= current ? theme.colors.accent : theme.colors.border,
                  backgroundColor: index === current ? theme.colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={
                    index < current
                      ? 'checkmark'
                      : index === current
                        ? 'ellipse'
                        : 'ellipse-outline'
                  }
                  size={index === current ? 9 : 14}
                  color={
                    index === current
                      ? theme.colors.onPrimary
                      : index < current
                        ? theme.colors.accent
                        : theme.colors.muted
                  }
                />
              </View>
              <Text style={index === current ? ui.label : ui.caption}>{statusLabels[stage]}</Text>
              {index === current && (
                <Text style={[ui.caption, { color: theme.colors.accent }]}>Current</Text>
              )}
            </View>
          ))}
        </View>
        <View style={ui.card}>
          <Text style={ui.label}>Delivery address</Text>
          <Text style={ui.body}>
            {order.firstName} {order.lastName}
          </Text>
          <Text style={ui.caption}>
            {order.address}, {order.country} {order.postalCode ?? ''}
          </Text>
          <Text style={ui.caption}>{order.phone}</Text>
        </View>
        <View style={ui.card}>
          <DetailRow
            label={
              paid ? 'Paid' : order.paymentType === 'CASH_ON_DELIVERY' ? 'Due on delivery' : 'Total'
            }
            value={money(order.totalPrice)}
          />
          <Text style={ui.caption}>
            {payment}
            {!paid && order.paymentType === 'CASH_ON_DELIVERY'
              ? ' · Pay when your order arrives'
              : ''}
          </Text>
        </View>
        {!!order.product.items?.length && (
          <Disclosure title="Beads & price details">
            {order.product.items.map((item) => (
              <DetailRow
                key={item.id}
                label={item.quantity + ' × ' + item.subCategory.name}
                value={money(item.quantity * item.unitPrice)}
              />
            ))}
          </Disclosure>
        )}
      </>
    );
  return (
    <View style={ui.card}>
      <View style={ui.between}>
        <Text style={ui.label}>{order.orderNumber}</Text>
        <Text style={ui.caption}>{status}</Text>
      </View>
      <View style={ui.row}>
        <CatalogImage
          imageUrl={order.product.designPreviewUrl ?? order.product.imageUrl}
          name={order.product.name}
          size={90}
        />
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[ui.sectionTitle, { fontSize: 22 }]}>{order.product.name}</Text>
          <Text style={ui.label}>{money(order.totalPrice)}</Text>
          <Text style={ui.caption}>{payment}</Text>
        </View>
      </View>
    </View>
  );
}
