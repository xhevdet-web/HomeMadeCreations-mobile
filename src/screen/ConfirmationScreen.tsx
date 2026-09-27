import { useCallback } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { OrderSummary } from '@/components/products/OrderSummary';
import { commerceApi } from '@/services/commerceApi';
import { useRemote } from '@/hooks/useRemote';
import { useCommerceStore } from '@/store/commerceStore';
import { useAuthStore } from '@/store/authStore';
export default function ConfirmationScreen() {
  const ui = useUI();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const load = useCallback((signal: AbortSignal) => commerceApi.orderDetails(id, signal), [id]);
  const result = useRemote(load);
  const user = useAuthStore((state) => state.user);
  const cached = useCommerceStore((state) => state.lastOrder);
  const order = result.data ?? (cached?.id === id && cached.userId === user?.id ? cached : null);
  return (
    <Page>
      <Header title={placed ? 'Order Confirmation' : 'Track order'} back />
      {placed && <Text style={ui.title}>Your order has been placed.</Text>}
      {order && <OrderSummary order={order} progress />}
      {((result.loading && !order) || result.error) && (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty=""
          retry={result.retry}
        />
      )}
      <Button title="Refresh status" secondary disabled={result.loading} onPress={result.retry} />
      {placed && <Button title="View Order" onPress={() =>
        router.replace({ pathname: '/confirmation', params: { id } })} />}
      {placed && <Button title="Back to Home" secondary onPress={() => router.replace('/')} />}
      <Button title="View my orders" onPress={() => router.replace('/orders')} />
    </Page>
  );
}
