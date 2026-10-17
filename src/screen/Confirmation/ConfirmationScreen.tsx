import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header, IconButton, Page, useUI } from '@/components/common/ui';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetOrderByIdQuery } from '@/api/endpoints/orderSlice';
import { useApiResult } from '@/api/useApiResult';
import { useCommerceStore } from '@/store/commerceStore';
import { useAuthStore } from '@/store/authStore';
import type { ApiOrder } from '@/api/commerceModels';
import { OrderPlaced } from './components/OrderPlaced';
import { OrderTracking } from './components/OrderTracking';

export default function ConfirmationScreen() {
  const ui = useUI();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<ApiOrder>(useGetOrderByIdQuery(id ?? '', { skip: !id || !user }));
  const cached = useCommerceStore((state) => state.lastOrder);
  const fetched = result.data?.id === id && result.data.userId === user?.id ? result.data : null;
  const order = fetched ?? (cached?.id === id && cached.userId === user?.id ? cached : null);
  const success = placed === '1';
  const home = () => router.dismissTo('/');
  const orders = () => router.dismissTo('/orders');

  return (
    <Page
      style={{ maxWidth: 600, gap: 16 }}
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
          <OrderPlaced order={order} />
        ) : (
          <OrderTracking order={order} />
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
