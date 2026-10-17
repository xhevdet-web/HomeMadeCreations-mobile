import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState, Header, IconButton, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useGetUserProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { SavedProduct } from '@/api/commerceModels';
import { editSavedDesign } from '@/services/savedDesign';
import { DesignCard } from './components/DesignCard';

export default function DesignsScreen() {
  const ui = useUI();
  const user = useAuthStore((state) => state.user);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useFeedbackState();
  const result = useApiResult<SavedProduct[]>(useGetUserProductsQuery(user?.id ?? '', { skip: !user }));
  const designs = result.data ?? [];
  const create = () => router.push('/categories');

  async function edit(id: string) {
    if (!user || editingId) return;
    setEditingId(id);
    setError('');
    try {
      await editSavedDesign(id, user.id);
      toast.info('Design opened. Next, edit and save a copy before reviewing your order.');
      router.push('/designer');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to open design.');
    } finally {
      setEditingId(null);
    }
  }

  function order(product: SavedProduct) {
    if (!user) return;
    useCommerceStore.getState().setCheckout(user.id, product);
    toast.info('Design selected. Next, review delivery details and place your order.');
    router.push('/checkout');
  }

  return (
    <Page style={{ gap: 16 }}>
      <Header
        title="My Designs"
        subtitle={designs.length ? `${designs.length} saved ${designs.length === 1 ? 'design' : 'designs'}` : undefined}
        right={
          <View style={[ui.row, { gap: 8 }]}>
            <IconButton
              name="refresh-outline"
              label="Refresh designs"
              disabled={result.loading}
              onPress={result.retry}
            />
            <IconButton name="add" label="Create a new design" onPress={create} />
          </View>
        }
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {result.loading || result.error ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty=""
          retry={result.retry}
        />
      ) : designs.length ? (
        designs.map((product) => (
          <DesignCard
            key={product.id}
            product={product}
            editing={editingId === product.id}
            disabled={!!editingId}
            onOrder={() => order(product)}
            onEdit={() => void edit(product.id)}
          />
        ))
      ) : (
        <EmptyState
          icon="sparkles-outline"
          title="No saved designs yet"
          description="Create your first piece in the studio. Saved designs appear here, ready to order."
          action="Start designing"
          onPress={create}
        />
      )}
    </Page>
  );
}
