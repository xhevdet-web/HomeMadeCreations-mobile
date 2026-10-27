import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Header, IconButton, Page } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { Pagination } from '@/components/common/Pagination';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useApiResult } from '@/api/useApiResult';
import type { OrderPage } from '@/api/commerceModels';
import { OrderCard } from './components/OrderCard';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const result = useApiResult<OrderPage>(useGetOrdersQuery(page));
  const orders = result.data?.data ?? [];
  const total = result.data?.meta.total ?? 0;
  const totalPages = Math.max(1, result.data?.meta.totalPages ?? 1);

  return (
    <Page style={{ gap: 16 }}>
      <Header
        title={t('orders.title')}
        subtitle={total ? t('orders.count', { count: total }) : undefined}
        right={
          <IconButton
            name="refresh-outline"
            label={t('orders.refresh')}
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
          title={t('orders.emptyTitle')}
          description={t('orders.emptyBody')}
          action={t('orders.emptyAction')}
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
