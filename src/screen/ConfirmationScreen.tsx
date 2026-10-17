import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header, Icon, IconButton, Page, useUI } from '@/components/common/ui';
import { ActionFooter, DetailRow, ProductOverview } from '@/components/checkout/Flow';
import { CatalogState } from '@/components/products/CatalogState';
import { OrderSummary } from '@/components/products/OrderSummary';
import { useGetOrderByIdQuery } from '@/api/endpoints/orderSlice';
import { useApiResult } from '@/api/useApiResult';
import { useTheme } from '@/hooks/useTheme';
import { useCommerceStore } from '@/store/commerceStore';
import { useAuthStore } from '@/store/authStore';
import { money } from '@/helper/pricing';
import type { ApiOrder } from '@/api/commerceModels';

export default function ConfirmationScreen() {
  const ui = useUI();
  const theme = useTheme();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<ApiOrder>(useGetOrderByIdQuery(id ?? '', { skip: !id || !user }));
  const cached = useCommerceStore((state) => state.lastOrder);
  const fetched = result.data?.id === id && result.data.userId === user?.id ? result.data : null;
  const order = fetched ?? (cached?.id === id && cached.userId === user?.id ? cached : null);
  const success = placed === '1';
  const paid = order?.paymentStatus === 'PAID';
  const cashOnDelivery = order?.paymentType === 'CASH_ON_DELIVERY';
  const home = () => router.dismissTo('/');
  const orders = () => router.dismissTo('/orders');

  return (
    <Page
      style={{ maxWidth: 600, gap: 20 }}
      footer={
        order ? (
          <ActionFooter
            title={success ? 'Track order' : 'Back to my orders'}
            onPress={
              success ? () => router.replace({ pathname: '/confirmation', params: { id } }) : orders
            }
          />
        ) : undefined
      }
    >
      <Header
        title={success ? 'Order placed' : 'Track order'}
        back={!success}
        right={
          success ? (
            <IconButton name="close" label="Close confirmation" onPress={home} />
          ) : order ? (
            <IconButton
              name="refresh-outline"
              label="Refresh status"
              disabled={result.loading}
              onPress={result.retry}
            />
          ) : undefined
        }
      />
      {order ? (
        success ? (
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
                {order.firstName
                  ? 'Thank you, ' + order.firstName + '.'
                  : 'Thank you for your order.'}
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
                {cashOnDelivery && !paid ? 'Pay cash when your order arrives. ' : ''}You can follow
                its progress in My Orders.
              </Text>
            </View>
          </>
        ) : (
          <OrderSummary order={order} progress />
        )
      ) : (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty="We couldn’t find this order. Open My Orders to check your purchases."
          retry={result.retry}
        />
      )}
      {order && result.error && (
        <Text accessibilityRole="alert" style={ui.caption}>
          Your order is saved. We couldn’t refresh its latest status. Please check again when you’re
          connected.
        </Text>
      )}
    </Page>
  );
}
