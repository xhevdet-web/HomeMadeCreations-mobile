import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState, Field, Header, IconButton, Page, useUI } from '@/components/common/ui';
import { ActionFooter, Disclosure, FlowStep, TextAction } from '@/components/checkout/Flow';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { useDesignStore } from '@/store/designStore';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { itemById, productById } from '@/services/catalog';
import { priceLines, money } from '@/helper/pricing';
import { designSignature, saveCurrentDesign } from '@/services/savedDesign';
import { useDesignPreviewCapture } from '@/hooks/useDesignPreviewCapture';
import { useTheme } from '@/hooks/useTheme';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { toast, useToastStore } from '@/store/toastStore';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';

export default function PreviewScreen() {
  const ui = useUI();
  const theme = useTheme();
  const draft = useDesignStore();
  const user = useAuthStore((state) => state.user);
  const stored = useCommerceStore((state) => state.savedDraft);
  const [error, setError] = useFeedbackState();
  const [intent, setIntent] = useState<'save' | 'checkout' | null>(null);
  const submitting = useRef(false);
  const { ref: previewRef, exporting, capture } = useDesignPreviewCapture();
  const [createProduct] = useCreateProductMutation();
  const product = productById[draft.productId];
  const busy = intent !== null;
  let signature = '';
  try {
    signature = designSignature();
  } catch {
    /* Validate when continuing. */
  }
  const saved =
    stored?.userId === user?.id && stored?.signature === signature ? stored.product : null;
  const lines = priceLines(draft.items);
  const total =
    saved?.price ?? lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const edit = () => router.dismissTo('/designer');

  async function save(checkout: boolean) {
    if (!user) {
      router.push('/login');
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setIntent(checkout ? 'checkout' : 'save');
    setError('');
    try {
      const result = await saveCurrentDesign(
        user.id,
        () => capture(useDesignStore.getState().items),
        (formData) => createProduct(formData).unwrap(),
      );
      if (checkout) {
        const notification = useToastStore.getState().current;
        if (notification) useToastStore.getState().dismiss(notification.id);
        useCommerceStore.getState().setCheckout(user.id, result);
        router.push('/checkout');
      } else {
        toast.success('Saved to My Designs. Come back whenever you’re ready.');
      }
    } catch (failure) {
      setError(apiError(failure).message);
    } finally {
      submitting.current = false;
      setIntent(null);
    }
  }

  if (!product || !draft.items.length)
    return (
      <Page style={{ maxWidth: 600 }}>
        <Header title="Your design" back />
        <EmptyState
          icon="sparkles-outline"
          title="Your story starts with a bead."
          description="Add a few details in the studio, then come back to see your finished piece."
          action="Open the studio"
          onPress={edit}
        />
      </Page>
    );

  return (
    <Page
      style={{ maxWidth: 600, gap: 20 }}
      footer={
        <ActionFooter
          amount={total}
          amountLabel={saved ? 'Design total' : 'Estimated total'}
          title={
            !product.categoryId
              ? 'Choose a category'
              : intent === 'checkout'
                ? 'Saving your design…'
                : 'Continue to delivery'
          }
          onPress={() => (product.categoryId ? void save(true) : router.push('/categories'))}
          loading={intent === 'checkout'}
          disabled={busy}
          caption="Your design is saved when you continue."
        />
      }
    >
      <Header
        title="Your design"
        back
        right={
          <TextAction
            title={saved ? 'Saved' : 'Save for later'}
            icon={saved ? 'checkmark' : 'bookmark-outline'}
            onPress={() => void save(false)}
            loading={intent === 'save'}
            disabled={busy || !!saved || !product.categoryId}
          />
        }
      />
      <FlowStep step={1} />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <View
          ref={previewRef}
          collapsable={false}
          testID="design-preview-canvas"
          style={{
            width: 280,
            height: 280,
            backgroundColor: exporting ? 'transparent' : theme.colors.background,
          }}
        >
          <JewelryCanvas
            exportMode={exporting}
            items={draft.items}
            type={product.type}
            size={280}
          />
        </View>
        <Text style={ui.caption}>
          {draft.items.length} beads
          {draft.selectedSize
            ? ' · ' +
              draft.selectedSize.name +
              ' · ' +
              draft.selectedSize.measurement +
              ' ' +
              draft.selectedSize.unit
            : ''}
        </Text>
        <TextAction title="Edit design" icon="create-outline" onPress={edit} disabled={busy} />
      </View>
      <Field
        label="Give your creation a name"
        value={draft.name}
        onChangeText={draft.rename}
        editable={!busy}
        maxLength={150}
      />
      <Disclosure
        title="Beads & price details"
        summary={lines.length + ' materials · ' + money(total)}
        disabled={busy}
      >
        {lines.map((line) => (
          <View key={line.itemId} style={{ gap: 8 }}>
            <View style={ui.between}>
              <Text style={[ui.label, { flex: 1 }]}>{line.name}</Text>
              <Text style={ui.label}>{money(line.quantity * line.unitPrice)}</Text>
            </View>
            <View style={ui.between}>
              <Text style={ui.caption}>{money(line.unitPrice)} each</Text>
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
                    draft.items.length >= (draft.selectedSize?.maxItems ?? Infinity) ||
                    line.quantity >= (itemById[line.itemId]?.stock ?? 0) ||
                    !itemById[line.itemId]?.available
                  }
                  onPress={() => draft.addItem(line.itemId)}
                />
              </View>
            </View>
          </View>
        ))}
      </Disclosure>
      <Disclosure
        title="Add a description"
        summary="Optional · a little meaning behind your piece"
        initiallyOpen={!!draft.description}
        disabled={busy}
      >
        <Field
          label="Description (optional)"
          value={draft.description}
          onChangeText={draft.describe}
          editable={!busy}
          multiline
          maxLength={2000}
        />
      </Disclosure>
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
    </Page>
  );
}
