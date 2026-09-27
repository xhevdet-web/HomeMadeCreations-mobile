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
import { fetchCategoryComponents } from '@/services/catalogApi';
import { User } from '@/types/models';

function CheckoutForm({ product, user }: { product: SavedProduct; user: User }) {
  const ui = useUI();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [country, setCountry] = useState(user.address.country);
  const [address, setAddress] = useState(user.address.street);
  const [postalCode, setPostalCode] = useState(user.address.postalCode);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const placing = useRef(false);
  const key = user.id + ':' + product.id;
  const pending = useCommerceStore((state) => !!state.pending[key]);
  async function refreshStock() {
    const components = await fetchCategoryComponents(product.categoryId);
    useCatalogStore.getState().registerComponents(components);
  }
  async function place() {
    if (placing.current || useCommerceStore.getState().pending[key]) return;
    if (![firstName, lastName, phone, country, address].every((value) => value.trim())) {
      setError('Complete first name, last name, phone, country and address.');
      return;
    }
    placing.current = true;
    setBusy(true);
    setError('');
    let sent = false;
    try {
      const profile = await commerceApi.updateProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        country: country.trim(),
        address: address.trim(),
        ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
      });
      useAuthStore.getState().update(profile);
      useCommerceStore.getState().setPending(key, true);
      sent = true;
      const order = await commerceApi.order(product.id, notes);
      useCommerceStore.getState().rememberOrder(order);
      // Keep this checkout locked after success to prevent submitting it again.
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
      if (failure instanceof ApiError && failure.status === 400)
        void refreshStock().catch(() => undefined);
    } finally {
      placing.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <SavedProductSummary product={product} />
      <Text style={ui.sectionTitle}>Delivery details</Text>
      <Field
        label="First name"
        value={firstName}
        onChangeText={setFirstName}
        editable={!busy}
        maxLength={100}
      />
      <Field
        label="Last name"
        value={lastName}
        onChangeText={setLastName}
        editable={!busy}
        maxLength={100}
      />
      <Field
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        editable={!busy}
        keyboardType="phone-pad"
        maxLength={32}
      />
      <Field
        label="Country"
        value={country}
        onChangeText={setCountry}
        editable={!busy}
        maxLength={100}
      />
      <Field
        label="Address"
        value={address}
        onChangeText={setAddress}
        editable={!busy}
        multiline
        maxLength={300}
      />
      <Field
        label="Postal code (optional)"
        value={postalCode}
        onChangeText={setPostalCode}
        editable={!busy}
        maxLength={20}
      />
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
      <Button
        title="Place Order"
        onPress={() => void place()}
        loading={busy}
        disabled={pending || busy}
      />
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
      if (product.createdById !== userId)
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
