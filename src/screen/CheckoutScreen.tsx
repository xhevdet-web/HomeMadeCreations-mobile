import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { SavedProductSummary } from '@/components/products/SavedProductSummary';
import { useRemote } from '@/hooks/useRemote';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useCatalogStore } from '@/store/catalogStore';
import { ApiError, commerceApi, SavedProduct } from '@/services/commerceApi';
import { fetchProduct, readyMadeUnavailable, fetchCategoryComponents } from '@/services/catalogApi';
import { User } from '@/types/models';
import { designSignature, editSavedDesign } from '@/services/savedDesign';
import { useDesignStore } from '@/store/designStore';

function CheckoutForm({ product, user }: { product: SavedProduct; user: User }) {
  const ui = useUI();
  const readyMade = product.productType === 'READY_MADE';
  const [currentProduct, setCurrentProduct] = useState(product);
  const missingDelivery = readyMade && ![user.firstName, user.lastName, user.phone, user.address?.country, user.address?.street].every(value => value?.trim());
  const unavailable = readyMade ? readyMadeUnavailable(currentProduct) : null;
  const [needsProfile, setNeedsProfile] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useFeedbackState();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const placing = useRef(false);
  const key = user.id + ':' + product.id;
  const pending = useCommerceStore((state) => !!state.pending[key]);
  async function refreshStock() {
    if (readyMade) {
      setCurrentProduct(await fetchProduct(product.id));
      return;
    }
    const components = await fetchCategoryComponents(product.categoryId);
    useCatalogStore.getState().registerComponents(components);
  }
  async function place() {
    if (placing.current || useCommerceStore.getState().pending[key] || missingDelivery || unavailable) return;
    placing.current = true;
    setBusy(true);
    toast.info('Placing your order. Please wait for confirmation before taking another action.');
    setError('');
    setNeedsProfile(false);
    let sent = false;
    try {
      useCommerceStore.getState().setPending(key, true);
      sent = true;
      const order = await commerceApi.order(product.id, notes);
      useCommerceStore.getState().rememberOrder(order);
      // Only clear the matching local draft after the backend confirms the Order.
      // An unrelated draft may also be open, so leave that one alone.
      const savedDraft = useCommerceStore.getState().savedDraft;
      try {
        if (!readyMade && savedDraft?.userId === user.id && savedDraft.product.id === product.id &&
          savedDraft.signature === designSignature()) {
          const current = useDesignStore.getState();
          current.start(current.productId, current.size);
          useCommerceStore.getState().clearDraft();
        }
      } catch { /* The placed Order is already confirmed; keep unrelated draft state. */ }
      // Keep this checkout locked after success to prevent submitting it again.
      toast.success('Order placed. Next, view your order and track its status. Pay cash when it arrives.');
      router.replace({ pathname: '/confirmation', params: { id: order.id, placed: '1' } });
      void Promise.allSettled([refreshStock(), commerceApi.orders()]);
    } catch (failure) {
      const uncertain =
        sent && (!(failure instanceof ApiError) || failure.status === 0 || failure.status >= 500);
      if (sent && !uncertain) useCommerceStore.getState().setPending(key, false);
      setError(
        uncertain
          ? 'We could not confirm whether your order was placed. Check My Orders before doing anything else. This checkout will not submit again.'
          : failure instanceof Error
            ? failure.message
            : 'Unable to place the order.',
      );
      if (failure instanceof ApiError && [400, 409, 422].includes(failure.status)) {
        setNeedsProfile(/profile|firstName|lastName|phone|country|address/i.test(failure.message));
        if (readyMade && /stock|inventory|insufficient/i.test(failure.message)) {
          setCurrentProduct(current => ({ ...current, stock: undefined }));
          try { await refreshStock(); } catch {
            setError(failure.message + ' Could not refresh stock. Reopen this order review to check availability.');
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
      try { sameDraft = cached?.userId === user.id && cached.product.id === product.id &&
        cached.signature === designSignature(); } catch { /* Reload below. */ }
      if (!sameDraft) await editSavedDesign(product.id, user.id);
      toast.info('Design opened. Make your changes, then save a new copy before ordering.');
      router.push('/designer');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to open the design.');
    } finally {
      setEditing(false);
    }
  }
  return (
    <>
      <SavedProductSummary product={currentProduct} />
      <Text style={ui.caption}>
        Delivery: {user.firstName} {user.lastName} / {user.phone ?? ''}{'\n'}
        {user.address?.street ?? ''} {user.address?.city ?? ''}, {user.address?.country ?? ''} {user.address?.postalCode ?? ''}
      </Text>
      <View style={ui.card}>
        <Text style={ui.sectionTitle}>Cash on Delivery</Text>
        <Text style={ui.body}>Pay when your order arrives.</Text>
      </View>
      <Field
        label="Customer notes (optional)"
        value={notes}
        onChangeText={setNotes}
        editable={!busy}
        multiline
        maxLength={2000}
      />
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
      {missingDelivery && <Text style={ui.body}>Complete your name, phone, country and delivery address in Profile before ordering.</Text>}
      {unavailable && <Text style={ui.body}>{unavailable}</Text>}
      {(needsProfile || missingDelivery) && (
        <Button
          title="Update my profile"
          secondary
          onPress={() => router.push({ pathname: '/profile', params: { next: 'checkout' } })}
        />
      )}
      <Button
        title="Place Order"
        onPress={() => void place()}
        loading={busy}
        disabled={pending || busy || missingDelivery || !!unavailable}
      />
      {!readyMade && <Button title="Edit Design" secondary disabled={busy || editing}
        loading={editing} onPress={() => void edit()} />}
      <Button title="My Orders" secondary onPress={() => router.push('/orders')} />
    </>
  );
}
export default function CheckoutScreen() {
  const ui = useUI();
  const user = useAuthStore((state) => state.user);
  const checkout = useCommerceStore((state) => state.checkout);
  const userId = user?.id;
  const id = checkout?.userId === user?.id ? checkout?.product.id : undefined;
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!id || !userId) return null;
      const product = await commerceApi.product(id, signal);
      if (product.productType === 'READY_MADE') {
        const unavailable = readyMadeUnavailable(product);
        if (product.isActive !== true) throw new Error(unavailable ?? 'Product unavailable.');
      } else if (product.createdById !== userId)
        throw new Error('This design belongs to another account.');
      return product;
    },
    [id, userId],
  );
  const result = useRemote(load);
  return (
    <Page>
      <Header title="Review your order" back />
      {result.loading || result.error ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty=""
          retry={result.retry}
        />
      ) : result.data && user ? (
        <CheckoutForm key={result.data.id + user.id} product={result.data} user={user} />
      ) : (
        <>
          <Text style={ui.body}>Save a design before placing an order.</Text>
          <Button title="My Designs" onPress={() => router.push('/designs')} />
        </>
      )}
    </Page>
  );
}
