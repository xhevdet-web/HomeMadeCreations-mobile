import { useState } from 'react';
import { router } from 'expo-router';
import { EmptyState, Header, IconButton, Page } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { Pagination } from '@/components/common/Pagination';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useApiResult } from '@/api/useApiResult';
import type { OrderPage } from '@/api/commerceModels';
import { OrderCard } from './components/OrderCard';

export default function OrdersScreen() {
  const [page, setPage] = useState(1);
  const result = useApiResult<OrderPage>(useGetOrdersQuery(page));
  const orders = result.data?.data ?? [];
  const total = result.data?.meta.total ?? 0;
  const totalPages = Math.max(1, result.data?.meta.totalPages ?? 1);

  return (
    <Page style={{ gap: 16 }}>
      <Header
        title="My Orders"
        subtitle={total ? `${total} ${total === 1 ? 'order' : 'orders'}` : undefined}
        right={
          <IconButton
            name="refresh-outline"
            label="Refresh orders"
            disabled={result.loading}
            onPress={result.retry}
          />
        }
      />
      {result.loading || result.error ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty=""
          retry={result.retry}
        />
      ) : orders.length ? (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => router.push({ pathname: '/confirmation', params: { id: order.id } })}
          />
        ))
      ) : (
        <EmptyState
          icon="bag-handle-outline"
          title="No orders yet"
          description="When you order a design or a ready-made piece, you can follow it here from workshop to doorstep."
          action="Start designing"
          onPress={() => router.push('/categories')}
        />
      )}
      {result.data && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          disabled={result.loading}
          onChange={setPage}
        />
      )}
    </Page>
  );
}
