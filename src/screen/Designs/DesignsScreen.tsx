import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Header, IconButton, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useGetUserProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { SavedProduct } from '@/api/commerceModels';
import { editSavedDesign } from '@/services/savedDesign';
import { isApparelProduct, loadApparelDesign } from '@/services/apparelDesign';
import { isCanvasProduct, loadCanvasDesign } from '@/services/canvasDesign';
import { isCaseProduct, loadCaseDesign } from '@/services/caseDesign';
import { DesignCard } from './components/DesignCard';

export default function DesignsScreen() {
  const ui = useUI();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useFeedbackState();
  const result = useApiResult<SavedProduct[]>(useGetUserProductsQuery(user?.id ?? '', { skip: !user }));
  const designs = result.data ?? [];
  const create = () => router.push('/categories');

  async function edit(product: SavedProduct) {
    if (!user || editingId) return;
    setEditingId(product.id);
    setError('');
    try {
      if (isCaseProduct(product)) {
        // Cases reopen on their phone model with the image and its placement restored.
        loadCaseDesign(product);
        toast.info(t('cases.opened'));
        router.push('/case-studio');
        return;
      }
      if (isApparelProduct(product)) {
        loadApparelDesign(product);
        toast.info(t('designs.openedApparel'));
        router.push('/apparel-studio');
        return;
      }
      if (isCanvasProduct(product)) {
        // Bouquets and gifts reopen with every position, layer and text restored.
        loadCanvasDesign(product);
        toast.info(t('designs.openedCanvas'));
        router.push('/studio');
        return;
      }
      await editSavedDesign(product.id, user.id);
      toast.info(t('designs.openedJewelry'));
      router.push('/designer');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('designs.openFailed'));
    } finally {
      setEditingId(null);
    }
  }

  function order(product: SavedProduct) {
    if (!user) return;
    useCommerceStore.getState().setCheckout(user.id, product);
    toast.info(t('designs.selected'));
    router.push('/checkout');
  }

  return (
    <Page style={{ gap: 16 }}>
      <Header
        title={t('designs.title')}
        subtitle={designs.length ? t('designs.count', { count: designs.length }) : undefined}
        right={
          <View style={[ui.row, { gap: 8 }]}>
            <IconButton
              name="refresh-outline"
              label={t('designs.refresh')}
              disabled={result.loading}
              onPress={result.retry}
            />
            <IconButton name="add" label={t('designs.create')} onPress={create} />
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
            onEdit={() => void edit(product)}
          />
        ))
      ) : (
        <EmptyState
          icon="sparkles-outline"
          title={t('designs.emptyTitle')}
          description={t('designs.emptyBody')}
          action={t('designs.emptyAction')}
          onPress={create}
        />
      )}
    </Page>
  );
}
