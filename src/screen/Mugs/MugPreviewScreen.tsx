import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { QuantityStepper } from '@/components/common/QuantityStepper';
import { useCreateProductMutation, useGetProductByIdQuery } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useMugStore } from '@/store/mugStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { MAX_MUGS_PER_ORDER, mugPrintArea, printAspect } from '@/helper/mugs';
import { captureViewPreview } from '@/services/designPreview';
import { elementImage, saveMugDesign } from '@/services/mugDesign';
import { MugMockup, mugMockupHeight } from './components/MugMockup';
import { MugPrintCanvas } from './components/MugPrintCanvas';

const frames = (count: number) => new Promise<void>((resolve) => {
  const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());
  step(count);
});

/**
 * Mugs, the review: the design on a white mug from both sides, the flat print it comes
 * from, how many mugs, and the total. The flat print is captured once when the screen
 * opens; the mugs are drawn from it. Back keeps the design exactly as it was.
 */
export default function MugPreviewScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const draft = useMugStore();
  const blank = useGetProductByIdQuery(draft.baseProductId ?? '', { skip: !draft.baseProductId });
  const area = mugPrintArea(blank.data);
  const [createProduct] = useCreateProductMutation();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<'save' | 'order' | null>(null);
  const [message, setMessage] = useFeedbackState();
  const [printUri, setPrintUri] = useState<string | null>(null);
  const [printFailed, setPrintFailed] = useState(false);
  const printRef = useRef<ComponentRef<typeof View>>(null);
  const mugsRef = useRef<ComponentRef<typeof View>>(null);
  const contentWidth = Math.min(width, 760) - 44;
  const mugWidth = Math.min((contentWidth - 24) / 2, 240);
  const printWidth = contentWidth - 24;
  const ready = !!draft.categoryId && (draft.elements.length > 0 || draft.texts.length > 0);
  const images = draft.elements.map(elementImage);

  // The flat print is the source of both mugs and the production file.
  useEffect(() => {
    if (!area || !ready) return;
    let active = true;
    void (async () => {
      try {
        await frames(3);
        const uri = await captureViewPreview(printRef.current as unknown as View | null, images,
          { format: 'png', pixels: 1600, aspect: printAspect(area) });
        if (active) setPrintUri(uri);
      } catch {
        if (active) setPrintFailed(true);
      }
    })();
    return () => { active = false; };
  }, [!!area, ready]); // eslint-disable-line react-hooks/exhaustive-deps -- once per visit

  if (!ready || blank.isError || (!blank.isLoading && !area))
    return (
      <Page style={{ gap: 16 }}>
        <Header title={t('mugs.preview.title')} back />
        <Notice text={ready ? t('mugs.errors.notReady') : t('mugs.errors.addImage')} />
        <Button title={t('mugs.preview.edit')} onPress={() => router.back()} />
      </Page>
    );

  const price = blank.data?.price ?? 0;
  const stock = blank.data?.stock ?? 0;
  const maxQuantity = Math.max(1, Math.min(MAX_MUGS_PER_ORDER, stock));
  const soldOut = !!blank.data && stock < 1;

  async function capture() {
    if (!area) throw new Error(t('mugs.errors.notReady'));
    const print = printUri ?? await captureViewPreview(printRef.current as unknown as View | null, images,
      { format: 'png', pixels: 1600, aspect: printAspect(area) });
    const mockup = await captureViewPreview(mugsRef.current as unknown as View | null, [],
      { format: 'png', pixels: 840, aspect: mugMockupHeight(mugWidth) / (mugWidth * 2 + 12) });
    return { mockup, print };
  }

  async function save(order: boolean) {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (busy || !draft.categoryId) return;
    setBusy(order ? 'order' : 'save');
    setMessage('');
    try {
      const product = await saveMugDesign(user.id, draft.categoryId, capture,
        (formData) => createProduct(formData).unwrap());
      if (order) {
        useCommerceStore.getState().setCheckout(user.id, product, null, quantity);
        router.push('/checkout');
      } else {
        toast.success(t('studio.savedToDesigns'));
      }
    } catch (failure) {
      // Nothing in the draft changes, so the design is still here to try again.
      setMessage(t('studio.stillHere', { message: apiError(failure).message }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Page style={{ gap: 18 }}
      footer={
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={{ flex: 1 }}>
              <Button title={t('mugs.preview.save')} icon="bookmark-outline" secondary loading={busy === 'save'}
                disabled={!!busy || !area} onPress={() => void save(false)} />
            </View>
            <View style={{ flex: 1.3 }}>
              <Button title={soldOut ? t('readyMade.outOfStock') : t('mugs.preview.order')} icon="bag-check-outline"
                loading={busy === 'order'} disabled={!!busy || !area || soldOut} onPress={() => void save(true)} />
            </View>
          </View>
        </SafeAreaView>
      }>
      <Header title={t('mugs.preview.title')} back />
      <View style={{ gap: 4 }}>
        <Text style={ui.eyebrow}>{t('mugs.preview.eyebrow')}</Text>
        <Text style={styles.title}>{t('mugs.preview.heading')}</Text>
      </View>

      <View style={styles.stage}>
        <StageBackground />
        {printUri && area ? (
          // Captured as the product picture: the mug from both sides, without any guide.
          <View ref={mugsRef} collapsable={false} style={styles.mugs}>
            <MugMockup printUri={printUri} area={area} width={mugWidth} handle="left" />
            <MugMockup printUri={printUri} area={area} width={mugWidth} handle="right" />
          </View>
        ) : (
          <View style={[styles.waiting, { height: mugMockupHeight(mugWidth) }]}>
            {printFailed
              ? <Text style={ui.caption}>{t('mugs.preview.previewFailed')}</Text>
              : <ActivityIndicator color={theme.colors.accent} accessibilityLabel={t('mugs.preview.preparing')} />}
          </View>
        )}
      </View>
      <Text style={[ui.caption, { textAlign: 'center' }]}>{t('mugs.preview.sides')}</Text>

      {area && (
        <View style={{ gap: 8 }}>
          <Text style={styles.section}>{t('mugs.preview.printTitle')}</Text>
          <View style={styles.printWrap}>
            {/* The flat print as it is produced, without guides. */}
            <View ref={printRef} collapsable={false}>
              <MugPrintCanvas area={area} width={printWidth} elements={draft.elements} texts={draft.texts} />
            </View>
          </View>
        </View>
      )}

      <View style={[ui.card, styles.summary]}>
        <View style={ui.between}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={ui.label}>{t('mugs.preview.quantity')}</Text>
            <Text style={ui.caption}>{t('mugs.preview.quantityHint')}</Text>
          </View>
          <QuantityStepper quantity={Math.min(quantity, maxQuantity)} min={1} max={maxQuantity}
            label={t('mugs.customMug')} onChange={setQuantity} />
        </View>
        <View style={ui.divider} />
        <View style={ui.between}>
          <Text style={ui.body}>{t('mugs.preview.priceEach')}</Text>
          <Text style={ui.label}>{money(price)}</Text>
        </View>
        <View style={ui.between}>
          <Text style={styles.totalLabel}>{t('common.total')}</Text>
          <Text style={styles.totalValue}>{money(price * Math.min(quantity, maxQuantity))}</Text>
        </View>
        <Text style={ui.caption}>{t('mugs.preview.priceNote')}</Text>
      </View>
      <Button title={t('mugs.preview.edit')} icon="create-outline" secondary onPress={() => router.back()}
        disabled={!!busy} />
      {message ? <Notice text={message} /> : null}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 32 },
    section: { color: c.text, fontSize: 16, fontWeight: '600' },
    stage: {
      paddingVertical: 20, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.thumbnail,
    },
    mugs: { flexDirection: 'row', gap: 12 },
    waiting: { alignItems: 'center', justifyContent: 'center' },
    printWrap: {
      padding: 12, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.thumbnail,
      alignItems: 'center',
    },
    summary: { padding: 16, gap: 10 },
    totalLabel: { color: c.text, fontSize: 16, fontWeight: '600' },
    totalValue: { color: c.accent, fontSize: 21, fontWeight: '600' },
    footer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bottomBar },
    footerInner: {
      flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 760,
      alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10,
    },
  });
};
