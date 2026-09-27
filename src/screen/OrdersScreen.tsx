import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { OrderSummary } from '@/components/products/OrderSummary';
import { commerceApi } from '@/services/commerceApi';
import { useRemote } from '@/hooks/useRemote';
export default function OrdersScreen() {
  const ui = useUI();
  const [page, setPage] = useState(1);
  const load = useCallback((signal: AbortSignal) => commerceApi.orders(page, signal), [page]);
  const result = useRemote(load);
  return (
    <Page>
      <Header title="My Orders" />
      <Button title="Refresh orders" secondary onPress={result.retry} disabled={result.loading} />
      {result.loading || result.error || !result.data?.data.length ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty="No orders yet."
          retry={result.retry}
        />
      ) : (
        result.data.data.map((order) => (
          <View key={order.id} style={{ gap: 8 }}>
            <OrderSummary order={order} />
            <Button
              title={'Track ' + order.orderNumber}
              onPress={() => router.push({ pathname: '/confirmation', params: { id: order.id } })}
            />
          </View>
        ))
      )}
      {result.data && (
        <Text style={ui.caption}>
          Page {page} of {Math.max(1, result.data.meta.totalPages)}
        </Text>
      )}
      {page > 1 && (
        <Button
          title="Previous page"
          secondary
          disabled={result.loading}
          onPress={() => setPage((n) => n - 1)}
        />
      )}
      {result.data && page < result.data.meta.totalPages && (
        <Button
          title="Next page"
          secondary
          disabled={result.loading}
          onPress={() => setPage((n) => n + 1)}
        />
      )}
    </Page>
  );
}
