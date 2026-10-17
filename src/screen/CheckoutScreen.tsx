import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Header, Icon, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import {
  ActionFooter,
  Disclosure,
  FlowStep,
  ProductOverview,
  TextAction,
  DetailRow,
} from '@/components/checkout/Flow';
import { useTheme } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { useApiResult } from '@/api/useApiResult';
import { apiError } from '@/api/apiSlice';
import { useGetOwnedProductByIdQuery, useLazyGetOwnedProductByIdQuery } from '@/api/endpoints/productSlice';
import { useLazyGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateOrderMutation, useLazyGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useCatalogStore } from '@/store/catalogStore';
import type { SavedProduct } from '@/api/commerceModels';
import { readyMadeUnavailable } from '@/api/catalogModels';
import { User } from '@/types/models';
import { designSignature, editSavedDesign } from '@/services/savedDesign';
import { useDesignStore } from '@/store/designStore';

function CheckoutForm({ product, user }: { product: SavedProduct; user: User }) {
  const ui = useUI();
  const theme = useTheme();
  const readyMade = product.productType === 'READY_MADE';
  const [currentProduct, setCurrentProduct] = useState(product);
  const missingDelivery = ![
    user.firstName,
    user.lastName,
    user.phone,
    user.address?.country,
    user.address?.street,
  ].every((value) => value?.trim());
  const unavailable = readyMade ? readyMadeUnavailable(currentProduct) : null;
  const [needsProfile, setNeedsProfile] = useState(false);
  const [notes, setNotes] = useState(() => useCommerceStore.getState().checkout?.notes ?? '');
  const [error, setError] = useFeedbackState();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [createOrder] = useCreateOrderMutation();
  const [getProduct] = useLazyGetOwnedProductByIdQuery();
  const [getComponents] = useLazyGetCategoryComponentsQuery();
  const [getOrders] = useLazyGetOrdersQuery();
  const placing = useRef(false);
  const key = user.id + ':' + product.id;
  const pending = useCommerceStore((state) => !!state.pending[key]);
  async function refreshStock() {
    if (readyMade) {
      setCurrentProduct(await getProduct(product.id, false).unwrap());
      return;
    }
    const components = await getComponents(product.categoryId, false).unwrap();
    useCatalogStore.getState().registerComponents(components);
  }
  async function place() {
    if (
      placing.current ||
      useCommerceStore.getState().pending[key] ||
      missingDelivery ||
      unavailable
    )
      return;
    placing.current = true;
    setBusy(true);
    setError('');
    setNeedsProfile(false);
    let sent = false;
    try {
      useCommerceStore.getState().setPending(key, true);
      sent = true;
      const order = await createOrder({ productId: product.id, notes }).unwrap();
      useCommerceStore.getState().rememberOrder(order);
      // Only clear the matching local draft after the backend confirms the Order.
      // An unrelated draft may also be open, so leave that one alone.
      const savedDraft = useCommerceStore.getState().savedDraft;
      try {
        if (
          !readyMade &&
          savedDraft?.userId === user.id &&
          savedDraft.product.id === product.id &&
          savedDraft.signature === designSignature()
        ) {
          const current = useDesignStore.getState();
          current.start(current.productId, current.size);
          useCommerceStore.getState().clearDraft();
        }
      } catch {
        /* The placed Order is already confirmed; keep unrelated draft state. */
      }
      // Keep this checkout locked after success to prevent submitting it again.
      router.replace({ pathname: '/confirmation', params: { id: order.id, placed: '1' } });
      void Promise.allSettled([refreshStock(), getOrders(1, false).unwrap()]);
    } catch (failure) {
      const requestError = apiError(failure);
      const uncertain = sent && (requestError.status === 0 || requestError.status >= 500);
      if (sent && !uncertain) useCommerceStore.getState().setPending(key, false);
      setError(
        uncertain
          ? 'We could not confirm whether your order was placed. Check My Orders before doing anything else. This checkout will not submit again.'
          : requestError.message,
      );
      if ([400, 409, 422].includes(requestError.status)) {
        setNeedsProfile(/profile|firstName|lastName|phone|country|address/i.test(requestError.message));
        if (readyMade && /stock|inventory|insufficient/i.test(requestError.message)) {
          setCurrentProduct((current) => ({ ...current, stock: undefined }));
          try {
            await refreshStock();
          } catch {
            setError(
              requestError.message +
                ' Could not refresh stock. Reopen this order review to check availability.',
            );
          }
        } else {
          void refreshStock().catch(() => undefined);
        }
      }
    } finally {
      placing.current = false;
      setBusy(false);
    }
  }
  async function edit() {
    if (editing || busy) return;
    setEditing(true);
    setError('');
    try {
      const cached = useCommerceStore.getState().savedDraft;
      let sameDraft = false;
      try {
        sameDraft =
          cached?.userId === user.id &&
          cached.product.id === product.id &&
          cached.signature === designSignature();
      } catch {
        /* Reload below. */
      }
      if (!sameDraft) await editSavedDesign(product.id, user.id);
      router.dismissTo('/designer');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to open the design.');
    } finally {
      setEditing(false);
    }
  }
  const updateDelivery = () => router.push({ pathname: '/profile', params: { next: 'checkout' } });
  const checkOrders = () => router.push('/orders');
  const requiresDelivery = needsProfile || missingDelivery;
  return (
    <Page
      style={{ maxWidth: 600, gap: 20 }}
      footer={
        <ActionFooter
          amount={currentProduct.price}
          amountLabel="Total due on delivery"
          title={
            pending && !busy
              ? 'Check my orders'
              : requiresDelivery
                ? 'Add delivery details'
                : busy
                  ? 'Placing your order…'
                  : 'Place Order'
          }
          onPress={
            pending && !busy ? checkOrders : requiresDelivery ? updateDelivery : () => void place()
          }
          loading={busy}
          disabled={busy || editing || (!!unavailable && !pending)}
          caption={
            pending && !busy
              ? 'Check your orders before trying again.'
              : requiresDelivery
                ? 'We need an address and phone number to deliver your order.'
                : 'Pay cash when your order arrives.'
          }
        />
      }
    >
      <Header title="Delivery & payment" back />
      {!readyMade && <FlowStep step={2} />}
      <ProductOverview
        product={currentProduct}
        action={
          !readyMade && (
            <TextAction
              title="Edit Design"
              icon="create-outline"
              disabled={busy || editing || pending}
              loading={editing}
              onPress={() => void edit()}
            />
          )
        }
      />
      <View style={ui.card}>
        <View style={ui.between}>
          <View style={ui.row}>
            <Icon name="location-outline" color={theme.colors.accent} />
            <Text style={ui.label}>Deliver to</Text>
          </View>
          <TextAction title="Edit delivery" onPress={updateDelivery} disabled={busy || pending} />
        </View>
        <View style={{ gap: 5 }}>
          <Text style={ui.label}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={ui.body}>
            {[
              user.address?.street,
              user.address?.city,
              user.address?.postalCode,
              user.address?.country,
            ]
              .filter(Boolean)
              .join(', ') || 'Add your delivery address'}
          </Text>
          <Text style={ui.caption}>{user.phone || 'Add a phone number'}</Text>
        </View>
      </View>
      <View style={[ui.card, { flexDirection: 'row', gap: 14, alignItems: 'center' }]}>
        <Icon name="wallet-outline" color={theme.colors.accent} size={24} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ui.label}>Cash on Delivery</Text>
          <Text style={ui.caption}>Nothing to pay now. Pay when your piece arrives.</Text>
        </View>
        <Icon name="checkmark-circle" color={theme.colors.accent} size={20} />
      </View>
      <Disclosure
        title="Add a delivery note"
        summary="Optional · anything your courier should know"
        initiallyOpen={!!notes}
        disabled={busy || pending}
      >
        <Field
          label="Customer notes (optional)"
          value={notes}
          onChangeText={(value) => {
            setNotes(value);
            useCommerceStore.getState().setCheckoutNotes(user.id, product.id, value);
          }}
          editable={!busy && !pending}
          multiline
          maxLength={2000}
        />
      </Disclosure>
      {!readyMade && (
        <Disclosure
          title="Price details"
          summary={currentProduct.itemCount + ' beads · ' + money(currentProduct.price)}
        >
          {currentProduct.items.map((item) => (
            <DetailRow
              key={item.id}
              label={item.quantity + ' × ' + item.subCategory.name}
              value={money(item.quantity * item.unitPrice)}
            />
          ))}
        </Disclosure>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {pending && !busy && (
        <Text style={ui.body}>
          An order was submitted for this design. Check My Orders for its status before placing
          another order.
        </Text>
      )}
      {requiresDelivery && (
        <Text style={ui.body}>
          Complete your name, phone, country and delivery address before ordering.
        </Text>
      )}
      {unavailable && <Text style={ui.body}>{unavailable}</Text>}
    </Page>
  );
}
export default function CheckoutScreen() {
  const ui = useUI();
  const user = useAuthStore((state) => state.user);
  const checkout = useCommerceStore((state) => state.checkout);
  const userId = user?.id;
  const id = checkout?.userId === user?.id ? checkout?.product.id : undefined;
  const result = useApiResult<SavedProduct>(useGetOwnedProductByIdQuery(id ?? '', { skip: !id || !userId }));
  const validProduct = result.data && (result.data.productType === 'READY_MADE'
    ? result.data.isActive === true : result.data.createdById === userId);
  if (result.data && validProduct && user && !result.loading && !result.error) {
    return <CheckoutForm key={result.data.id + user.id} product={result.data} user={user} />;
  }
  return (
    <Page style={{ maxWidth: 600 }}>
      <Header title="Delivery & payment" back />
      {result.loading || result.error ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty=""
          retry={result.retry}
        />
      ) : (
        <>
          <Text style={ui.body}>Choose a saved design or a ready-made piece to get started.</Text>
          <Button title="My Designs" onPress={() => router.push('/designs')} />
        </>
      )}
    </Page>
  );
}
