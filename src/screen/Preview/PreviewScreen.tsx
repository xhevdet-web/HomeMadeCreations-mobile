import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Field, Header, Page, useUI } from '@/components/common/ui';
import { Disclosure } from '@/components/common/Disclosure';
import { TextAction } from '@/components/common/TextAction';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { FlowStep } from '@/components/checkout/FlowStep';
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
import { PriceLineRow } from './components/PriceLineRow';

export default function PreviewScreen() {
  const { t } = useTranslation();
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

  function removeOne(itemId: string) {
    const entry = draft.items.find((item) => item.itemId === itemId);
    if (entry) {
      draft.select(entry.id);
      useDesignStore.getState().removeItem();
      draft.select(null);
    }
  }

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
        toast.success(t('canvasPreview.savedForLater'));
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
        <Header title={t('canvasPreview.title')} back />
        <EmptyState
          icon="sparkles-outline"
          title={t('jewelry.previewEmptyTitle')}
          description={t('jewelry.previewEmptyBody')}
          action={t('canvasPreview.openStudio')}
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
          amountLabel={saved ? t('canvasPreview.designTotal') : t('canvasPreview.estimatedTotal')}
          title={
            !product.categoryId
              ? t('jewelry.chooseCategory')
              : intent === 'checkout'
                ? t('canvasPreview.saving')
                : t('jewelry.continueToDelivery')
          }
          onPress={() => (product.categoryId ? void save(true) : router.push('/categories'))}
          loading={intent === 'checkout'}
          disabled={busy}
          caption={t('jewelry.previewCaption')}
        />
      }
    >
      <Header
        title={t('canvasPreview.title')}
        back
        right={
          <TextAction
            title={saved ? t('canvasPreview.saved') : t('canvasPreview.saveForLater')}
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
            capacity={draft.selectedSize?.maxItems}
          />
        </View>
        <Text style={ui.caption}>
          {t('counts.bead', { count: draft.items.length })}
          {draft.selectedSize
            ? ' · ' +
              draft.selectedSize.name +
              ' · ' +
              draft.selectedSize.measurement +
              ' ' +
              draft.selectedSize.unit
            : ''}
        </Text>
        <TextAction title={t('canvasPreview.editDesign')} icon="create-outline" onPress={edit} disabled={busy} />
      </View>
      <Field
        label={t('canvasPreview.nameLabel')}
        value={draft.name}
        onChangeText={draft.rename}
        editable={!busy}
        maxLength={150}
      />
      <Disclosure
        title={t('jewelry.beadsPriceDetails')}
        summary={t('jewelry.materials', { count: lines.length, price: money(total) })}
        disabled={busy}
      >
        {lines.map((line) => (
          <PriceLineRow
            key={line.itemId}
            line={line}
            disabled={busy}
            addDisabled={
              draft.items.length >= (draft.selectedSize?.maxItems ?? Infinity) ||
              line.quantity >= (itemById[line.itemId]?.stock ?? 0) ||
              !itemById[line.itemId]?.available
            }
            onRemove={() => removeOne(line.itemId)}
            onAdd={() => draft.addItem(line.itemId)}
          />
        ))}
      </Disclosure>
      <Disclosure
        title={t('jewelry.descriptionTitle')}
        summary={t('jewelry.descriptionSummary')}
        initiallyOpen={!!draft.description}
        disabled={busy}
      >
        <Field
          label={t('jewelry.descriptionLabel')}
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
