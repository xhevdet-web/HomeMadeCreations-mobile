import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { SavedProductSummary } from '@/components/products/SavedProductSummary';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { commerceApi } from '@/services/commerceApi';
import { editSavedDesign } from '@/services/savedDesign';
import { useRemote } from '@/hooks/useRemote';
export default function DesignsScreen() {
  const ui = useUI();
  const user = useAuthStore((state) => state.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(
    (signal: AbortSignal) => (user ? commerceApi.products(user.id, signal) : Promise.resolve([])),
    [user],
  );
  const result = useRemote(load);
  async function edit(id: string) {
    if (!user || busy) return;
    setBusy(true);
    setError('');
    try {
      await editSavedDesign(id, user.id);
      router.push('/designer');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to open design.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Header title="My Designs" />
      <Button title="Create a new design" onPress={() => router.push('/categories')} />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {result.loading || result.error || !result.data?.length ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty="No saved designs yet."
          retry={result.retry}
        />
      ) : (
        result.data.map((product) => (
          <View key={product.id} style={{ gap: 10 }}>
            <SavedProductSummary product={product} />
            <Button
              title={'Order ' + product.name}
              onPress={() => {
                if (user) {
                  useCommerceStore.getState().setCheckout(user.id, product);
                  router.push('/checkout');
                }
              }}
            />
            <Button
              title={'Edit a copy of ' + product.name}
              secondary
              disabled={busy}
              onPress={() => void edit(product.id)}
            />
          </View>
        ))
      )}
      <Button title="Refresh designs" secondary disabled={result.loading} onPress={result.retry} />
    </Page>
  );
}
