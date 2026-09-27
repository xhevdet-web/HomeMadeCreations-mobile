import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Header, IconButton, Page, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { SavedProductSummary } from '@/components/products/SavedProductSummary';
import { useDesignStore } from '@/store/designStore';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { itemById, productById } from '@/services/catalog';
import { priceLines, money } from '@/helper/pricing';
import { productInput, saveCurrentDesign } from '@/services/savedDesign';
export default function PreviewScreen() {
  const ui = useUI();
  const draft = useDesignStore();
  const user = useAuthStore((state) => state.user);
  const stored = useCommerceStore((state) => state.savedDraft);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const product = productById[draft.productId];
  let signature = '';
  try {
    signature = JSON.stringify(productInput());
  } catch {
    /* A local demo design cannot be saved remotely. */
  }
  const saved =
    stored?.userId === user?.id && stored?.signature === signature ? stored.product : null;
  const lines = priceLines(draft.items);
  async function save(checkout: boolean) {
    if (!user) {
      router.push('/login');
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await saveCurrentDesign(user.id);
      if (checkout) {
        useCommerceStore.getState().setCheckout(user.id, result);
        router.push('/checkout');
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save your design.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Page>
      <Header title="Your Creation" back />
      <JewelryCanvas items={draft.items} type={product.type} size={280} />
      <Field
        label="Give your creation a name"
        value={draft.name}
        onChangeText={draft.rename}
        editable={!busy}
        maxLength={150}
      />
      <Field
        label="Description (optional)"
        value={draft.description}
        onChangeText={draft.describe}
        editable={!busy}
        multiline
        maxLength={2000}
      />
      {lines.map((line) => (
        <View key={line.itemId} style={ui.card}>
          <Text style={ui.label}>
            {line.name}: {line.quantity} × {money(line.unitPrice)} ={' '}
            {money(line.quantity * line.unitPrice)}
          </Text>
          <View style={ui.row}>
            <IconButton
              name="remove"
              label={'Remove one ' + line.name}
              disabled={busy}
              onPress={() => {
                const entry = draft.items.find((item) => item.itemId === line.itemId);
                if (entry) {
                  draft.select(entry.id);
                  useDesignStore.getState().removeItem();
                  draft.select(null);
                }
              }}
            />
            <Text style={ui.label}>{line.quantity}</Text>
            <IconButton
              name="add"
              label={'Add one ' + line.name}
              disabled={
                busy ||
                draft.items.length >= 32 ||
                line.quantity >= itemById[line.itemId].stock ||
                !itemById[line.itemId].available
              }
              onPress={() => draft.addItem(line.itemId)}
            />
          </View>
        </View>
      ))}
      <Text style={ui.label}>Total beads: {draft.items.length}</Text>
      <Text style={ui.label}>
        Estimated price:{' '}
        {money(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))}
      </Text>
      {saved && <SavedProductSummary product={saved} />}
      {saved && (
        <Text style={ui.caption}>Design saved. Stock is checked when you place an order.</Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {!product.categoryId && (
        <Button title="Choose a category" onPress={() => router.push('/categories')} />
      )}
      <Button
        title={saved ? 'Design saved' : 'Save design'}
        onPress={() => void save(false)}
        loading={busy}
        disabled={!draft.items.length || !product.categoryId || !!saved}
      />
      <Button
        title="Review order"
        onPress={() => void save(true)}
        disabled={busy || !draft.items.length || !product.categoryId}
      />
      <Button title="Keep creating" secondary disabled={busy} onPress={() => router.back()} />
    </Page>
  );
}
