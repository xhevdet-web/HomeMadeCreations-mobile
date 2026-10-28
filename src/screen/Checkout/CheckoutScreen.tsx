import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Field, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { Disclosure } from '@/components/common/Disclosure';
import { TextAction } from '@/components/common/TextAction';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { FlowStep } from '@/components/checkout/FlowStep';
import { DetailRow, ProductOverview } from '@/components/checkout/ProductOverview';
import { CashOnDeliveryCard, DeliveryCard } from './components/CheckoutCards';
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
import { companyUnavailable, isCompanyProduct } from '@/api/catalogModels';
import { User } from '@/types/models';
import { designSignature, editSavedDesign } from '@/services/savedDesign';
import { useDesignStore } from '@/store/designStore';
import { useApparelStore } from '@/store/apparelStore';
import { isApparelProduct, loadApparelDesign } from '@/services/apparelDesign';
import { isCanvasProduct, loadCanvasDesign, savedComponentLines } from '@/services/canvasDesign';
import { useCanvasStore } from '@/store/canvasStore';
import { useCaseStore } from '@/store/caseStore';
import { caseMeta, isCaseProduct, loadCaseDesign } from '@/services/caseDesign';
import { parseTextLayers } from '@/api/builderModels';
import { componentCount } from '@/helper/builders';
import { ApparelSummary } from '@/components/apparel/ApparelSummary';

function CheckoutForm({ product, user, size }: { product: SavedProduct; user: User; size?: string | null }) {
  const ui = useUI();
  const { t } = useTranslation();
  const readyMade = isCompanyProduct(product);
  const apparel = !readyMade && isApparelProduct(product);
  const canvas = !readyMade && isCanvasProduct(product);
  const phoneCase = !readyMade && isCaseProduct(product);
  const [currentProduct, setCurrentProduct] = useState(product);
  const missingDelivery = ![
    user.firstName,
    user.lastName,
    user.phone,
    user.address?.country,
    user.address?.street,
  ].every((value) => value?.trim());
  const unavailable = readyMade ? companyUnavailable(t, currentProduct, size) : null;
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
      const order = await createOrder({ productId: product.id, notes, size: readyMade ? size : null }).unwrap();
      useCommerceStore.getState().rememberOrder(order);
      // Only clear the matching local draft after the backend confirms the Order.
      // An unrelated draft may also be open, so leave that one alone.
      const savedDraft = useCommerceStore.getState().savedDraft;
      const apparelDraft = useApparelStore.getState();
      if (apparel && apparelDraft.saved?.product.id === product.id && apparelDraft.categoryId)
        apparelDraft.start(apparelDraft.categoryId, t('drafts.myName', { name: product.category.name }));
      const caseDraft = useCaseStore.getState();
      if (phoneCase && caseDraft.saved?.product.id === product.id && caseDraft.categoryId) {
        // Ordered: the next case starts on the same phone, without the last image.
        caseDraft.load({ categoryId: caseDraft.categoryId, modelId: caseDraft.modelId, artwork: null,
          photo: caseDraft.photo, name: t('drafts.myName', { name: product.category.name }) });
        caseDraft.markSaved(null);
      }
      const canvasDraft = useCanvasStore.getState();
      if (canvas && canvasDraft.saved?.product.id === product.id && canvasDraft.categoryId) {
        // Ordered: the studio starts fresh for the next bouquet or gift.
        canvasDraft.load({
          builderType: canvasDraft.builderType, categoryId: canvasDraft.categoryId,
          categoryName: canvasDraft.categoryName, base: canvasDraft.base,
          name: t('drafts.myName', { name: canvasDraft.categoryName }), placements: [], texts: [],
          packaging: null,
        });
        canvasDraft.markSaved(null);
      }
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
          ? t('checkout.uncertain')
          : requestError.message,
      );
      if ([400, 409, 422].includes(requestError.status)) {
        setNeedsProfile(/profile|firstName|lastName|phone|country|address/i.test(requestError.message));
        if (readyMade && /stock|inventory|insufficient/i.test(requestError.message)) {
          setCurrentProduct((current) => ({ ...current, stock: undefined }));
          try {
            await refreshStock();
          } catch {
            setError(t('checkout.stockRefreshFailed', { message: requestError.message }));
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
      if (apparel) {
        // Reopen the Apparel Studio with every placement, side, base and size restored.
        if (useApparelStore.getState().saved?.product.id !== product.id) loadApparelDesign(product);
        router.dismissTo('/apparel-studio');
        return;
      }
      if (phoneCase) {
        // Reopen the Case Studio on the same phone, with the image and its placement.
        if (useCaseStore.getState().saved?.product.id !== product.id) loadCaseDesign(product);
        router.dismissTo('/case-studio');
        return;
      }
      if (canvas) {
        if (useCanvasStore.getState().saved?.product.id !== product.id) loadCanvasDesign(product);
        router.dismissTo('/studio');
        return;
      }
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
      setError(failure instanceof Error ? failure.message : t('checkout.openDesignFailed'));
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
          amountLabel={t('checkout.totalDue')}
          title={
            pending && !busy
              ? t('checkout.checkOrders')
              : requiresDelivery
                ? t('checkout.addDelivery')
                : busy
                  ? t('checkout.placing')
                  : t('checkout.placeOrder')
          }
          onPress={
            pending && !busy ? checkOrders : requiresDelivery ? updateDelivery : () => void place()
          }
          loading={busy}
          disabled={busy || editing || (!!unavailable && !pending)}
          caption={
            pending && !busy
              ? t('checkout.captionCheckOrders')
              : requiresDelivery
                ? t('checkout.captionNeedDelivery')
                : t('checkout.captionPayCash')
          }
        />
      }
    >
      <Header title={t('checkout.title')} back />
      {!readyMade && <FlowStep step={2} />}
      <ProductOverview
        product={currentProduct}
        size={readyMade ? size : null}
        action={
          !readyMade && (
            <TextAction
              title={t('checkout.editDesign')}
              icon="create-outline"
              disabled={busy || editing || pending}
              loading={editing}
              onPress={() => void edit()}
            />
          )
        }
      />
      <DeliveryCard user={user} onEdit={updateDelivery} disabled={busy || pending} />
      <CashOnDeliveryCard />
      <Disclosure
        title={t('checkout.noteTitle')}
        summary={t('checkout.noteSummary')}
        initiallyOpen={!!notes}
        disabled={busy || pending}
      >
        <Field
          label={t('checkout.noteLabel')}
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
      {apparel && <ApparelSummary product={currentProduct} />}
      {canvas && (
        <Disclosure
          title={t('orderDetails.priceDetails')}
          summary={componentCount(t, currentProduct.itemCount, currentProduct.category.builderType) + ' · ' +
            money(currentProduct.price)}
        >
          {savedComponentLines(currentProduct).map((line) => (
            <DetailRow key={line.key} label={line.quantity + ' × ' + line.name}
              value={money(line.quantity * line.unitPrice)} />
          ))}
          {parseTextLayers(currentProduct.textLayers).map((layer) => (
            <DetailRow key={layer.id} label={t('checkout.textLine', { text: layer.text })} value={t('checkout.free')} />
          ))}
        </Disclosure>
      )}
      {phoneCase && (
        <Disclosure
          title={t('orderDetails.priceDetails')}
          summary={caseMeta(t, currentProduct).join(' · ') + ' · ' + money(currentProduct.price)}
        >
          {!!currentProduct.baseProduct && (
            <DetailRow label={t('cases.studio.caseLine', { name: currentProduct.baseProduct.name })}
              value={money(currentProduct.basePrice ?? 0)} />
          )}
          {currentProduct.items.map((item) => (
            <DetailRow key={item.id}
              label={item.customImageUrl ? t('cases.ownPhoto') : item.subCategory.name}
              value={money(item.unitPrice)} />
          ))}
        </Disclosure>
      )}
      {!readyMade && !apparel && !canvas && !phoneCase && (
        <Disclosure
          title={t('orderDetails.priceDetails')}
          summary={componentCount(t, currentProduct.itemCount) + ' · ' + money(currentProduct.price)}
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
          {t('checkout.pendingNotice')}
        </Text>
      )}
      {requiresDelivery && (
        <Text style={ui.body}>
          {t('checkout.completeProfile')}
        </Text>
      )}
      {unavailable && <Text style={ui.body}>{unavailable}</Text>}
    </Page>
  );
}
export default function CheckoutScreen() {
  const ui = useUI();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const checkout = useCommerceStore((state) => state.checkout);
  const userId = user?.id;
  const id = checkout?.userId === user?.id ? checkout?.product.id : undefined;
  const result = useApiResult<SavedProduct>(useGetOwnedProductByIdQuery(id ?? '', { skip: !id || !userId }));
  const validProduct = result.data && (isCompanyProduct(result.data)
    ? result.data.isActive === true : result.data.createdById === userId);
  if (result.data && validProduct && user && !result.loading && !result.error) {
    return <CheckoutForm key={result.data.id + user.id} product={result.data} user={user}
      size={checkout?.size} />;
  }
  return (
    <Page style={{ maxWidth: 600 }}>
      <Header title={t('checkout.title')} back />
      {result.loading || result.error ? (
        <CatalogState
          loading={result.loading}
          error={result.error ?? ''}
          empty=""
          retry={result.retry}
        />
      ) : (
        <>
          <Text style={ui.body}>{t('checkout.emptyHint')}</Text>
          <Button title={t('navigation.myDesigns')} onPress={() => router.push('/designs')} />
        </>
      )}
    </Page>
  );
}
