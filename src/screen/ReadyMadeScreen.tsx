import { toast } from '@/store/toastStore';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { SavedProductSummary } from '@/components/products/SavedProductSummary';
import { useGetProductByIdQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import { readyMadeUnavailable } from '@/api/catalogModels';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import type { SavedProduct } from '@/api/commerceModels';

export default function ReadyMadeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ui = useUI();
  const user = useAuthStore(state => state.user);
  const result = useApiResult<SavedProduct>(useGetProductByIdQuery(id ?? '', { skip: !id }));
  const product = result.data;
  const unavailable = product ? readyMadeUnavailable(product) : 'Product unavailable.';
  return <Page>
    <Header title="Product details" back />
    {result.loading || result.error ? <CatalogState {...result} error={result.error ?? ''} empty="" /> :
      product && product.productType === 'READY_MADE' ? <>
        <SavedProductSummary product={product} />
        {unavailable && <Text style={ui.body}>{unavailable}</Text>}
        <Button title="Order Now" disabled={!!unavailable} onPress={() => {
          if (!user) { toast.info('Please log in, then return to this product to order.'); router.push('/login'); return; }
          useCommerceStore.getState().setCheckout(user.id, product);
          toast.info('Product selected. Next, review delivery details and place your Cash on Delivery order.');
          router.push('/checkout');
        }} />
      </> : <Text style={ui.body}>Product unavailable.</Text>}
  </Page>;
}
