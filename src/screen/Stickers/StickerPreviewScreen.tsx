import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useStickerStore } from '@/store/stickerStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { artworkOf, fitOf, MIN_STICKERS_PER_ORDER, stickerCount, stickerSizeLine } from '@/helper/stickers';
import { captureViewPreview } from '@/services/designPreview';
import { designWithoutImage, saveStickerDesign } from '@/services/stickerDesign';
import { StickerCanvas } from './components/StickerCanvas';
import { StickerQuantitySelector } from './components/StickerQuantitySelector';
import { StickerSetPreview } from './components/StickerSetPreview';

const THUMB = 64;
const frames = (count: number) => new Promise<void>((resolve) => {
  const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());
  step(count);
});

/**
 * Stickers, step 3: the whole set as it will be printed (no guides), how many of each
 * design, and the total. The total shown is an estimate from the size's price per sticker;
 * the backend prices the saved set itself. Back keeps every design as it was.
 */
export default function StickerPreviewScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const draft = useStickerStore();
  const [createProduct] = useCreateProductMutation();
  const [busy, setBusy] = useState<'save' | 'order' | null>(null);
  const [message, setMessage] = useFeedbackState();
  const setRef = useRef<ComponentRef<typeof View>>(null);
  const size = draft.size;
  const ready = !!size && !!draft.categoryId && draft.designs.length > 0 && !designWithoutImage(draft.designs);

  if (!ready)
    return (
      <Page style={{ gap: 16 }}>
        <Header title={t('stickers.preview.title')} back />
        <Notice text={t('stickers.preview.unavailable')} />
        <Button title={t('stickers.preview.edit')} onPress={() => router.back()} />
      </Page>
    );

  const count = stickerCount(draft.designs);
  const tooFew = count < MIN_STICKERS_PER_ORDER;
  // Shown as an estimate; the saved product's price comes from the backend.
  const estimate = size.price * count;
  const setWidth = Math.min(width - 76, 360);

  async function capture() {
    await frames(3);
    return captureViewPreview(setRef.current as unknown as View | null,
      draft.designs.map(artworkOf), { format: 'png', pixels: 840 });
  }

  async function save(order: boolean) {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (busy || !draft.categoryId) return;
    setBusy(order ? 'order' : 'save');
    setMessage('');
    try {
      const product = await saveStickerDesign(user.id, draft.categoryId, capture,
        (formData) => createProduct(formData).unwrap());
      if (order) {
        useCommerceStore.getState().setCheckout(user.id, product);
        router.push('/checkout');
      } else {
        toast.success(t('studio.savedToDesigns'));
      }
    } catch (failure) {
      // Nothing in the draft changes, so every design is still here to try again.
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
              <Button title={t('stickers.preview.save')} icon="bookmark-outline" secondary
                loading={busy === 'save'} disabled={!!busy} onPress={() => void save(false)} />
            </View>
            <View style={{ flex: 1.3 }}>
              <Button title={t('stickers.preview.order')} icon="bag-check-outline" loading={busy === 'order'}
                disabled={!!busy || tooFew} onPress={() => void save(true)} />
            </View>
          </View>
        </SafeAreaView>
      }>
      <Header title={t('stickers.preview.title')} back />
      <View style={{ gap: 4 }}>
        <Text style={ui.eyebrow}>{t('stickers.preview.eyebrow')}</Text>
        <Text style={styles.title}>{t('stickers.preview.heading')}</Text>
        <Text style={ui.body}>{stickerSizeLine(t, size)}</Text>
      </View>

      <View style={styles.stage}>
        <StageBackground />
        {/* Captured as the set's picture: the designs only, without any editing guide. */}
        <View ref={setRef} collapsable={false} testID="design-preview-canvas">
          <StickerSetPreview size={size} designs={draft.designs} width={setWidth} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.section}>{t('stickers.preview.quantities')}</Text>
        {draft.designs.map((design, index) => {
          const label = t('stickers.studio.designNumber', { number: index + 1 });
          const thumbWidth = size.widthMm >= size.heightMm ? THUMB : (THUMB * size.widthMm) / size.heightMm;
          return (
            <View key={design.id} style={[ui.card, styles.line]}>
              <View style={styles.thumb}>
                <StickerCanvas size={size} width={thumbWidth} imageUri={artworkOf(design)} fit={fitOf(design)}
                  imageSize={design.imageSize} transform={design} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={ui.label}>{label}</Text>
                <Text style={ui.caption}>{t('stickers.stickerCount', { count: design.quantity })}</Text>
              </View>
              <StickerQuantitySelector quantity={design.quantity} label={label}
                onChange={(quantity) => draft.setQuantity(design.id, quantity)} />
            </View>
          );
        })}
      </View>

      <View style={[ui.card, styles.summary]}>
        <View style={ui.between}>
          <Text style={ui.body}>{t('stickers.preview.uniqueDesigns')}</Text>
          <Text style={ui.label}>{draft.designs.length}</Text>
        </View>
        <View style={ui.between}>
          <Text style={ui.body}>{t('stickers.preview.totalStickers')}</Text>
          <Text style={ui.label}>{count}</Text>
        </View>
        <View style={ui.between}>
          <Text style={ui.body}>{t('stickers.preview.pricePerSticker')}</Text>
          <Text style={ui.label}>{money(size.price)}</Text>
        </View>
        <View style={ui.divider} />
        <View style={ui.between}>
          <Text style={styles.totalLabel}>{t('common.total')}</Text>
          <Text style={styles.totalValue}>{money(estimate)}</Text>
        </View>
        <Text style={[ui.caption, tooFew && { color: theme.colors.danger }]}>
          {tooFew
            ? t('stickers.preview.minimum', { count: MIN_STICKERS_PER_ORDER, missing: MIN_STICKERS_PER_ORDER - count })
            : t('stickers.preview.priceNote')}
        </Text>
      </View>
      {message ? <Notice text={message} /> : null}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 32 },
    stage: {
      paddingVertical: 18, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.thumbnail,
    },
    section: { color: c.text, fontSize: 16, fontWeight: '600' },
    line: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    thumb: {
      width: THUMB + 8, height: THUMB + 8, borderRadius: 12, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center',
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
