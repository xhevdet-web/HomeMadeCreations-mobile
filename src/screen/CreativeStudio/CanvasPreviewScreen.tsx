import { useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Chips, EmptyState, Field, Header, Page, useUI } from '@/components/common/ui';
import { PhotoStage } from './components/PhotoStage';
import { TextAction } from '@/components/common/TextAction';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { FlowStep } from '@/components/checkout/FlowStep';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { choicePrice, sceneWrap } from '@/api/packagingModels';
import { apiError } from '@/api/apiSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogComponent } from '@/api/catalogModels';
import { useAuthStore } from '@/store/authStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useCommerceStore } from '@/store/commerceStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useThemedStyles } from '@/hooks/useTheme';
import { componentCount } from '@/helper/builders';
import { money } from '@/helper/pricing';
import { canvasSignature, componentLines, saveCanvasDesign } from '@/services/canvasDesign';
import { type Theme } from '@/constants/theme';
import { FreeDesignCanvas } from './components/FreeDesignCanvas';
import { useCanvasCapture } from './components/useCanvasCapture';
import { PackagedPreview } from './components/packaging/PackagedPreview';

/** A clean look at the finished bouquet or gift before it is saved and ordered. */
export default function CanvasPreviewScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const draft = useCanvasStore();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<CatalogComponent[]>(
    useGetCategoryComponentsQuery(draft.categoryId ?? '', { skip: !draft.categoryId }));
  const [createProduct] = useCreateProductMutation();
  const gift = draft.builderType === 'GIFT';
  // Closed gifts can be seen packaged; the design (and the saved preview) stays the inside.
  const [packagedView, setPackagedView] = useState(false);
  const { ref, capture } = useCanvasCapture();
  const [intent, setIntent] = useState<'save' | 'order' | null>(null);
  const [error, setError] = useFeedbackState();
  const submitting = useRef(false);
  const edit = () => (router.canGoBack() ? router.back() : router.replace('/studio'));

  if (!draft.builderType || !draft.placements.length)
    return (
      <Page style={{ maxWidth: 600 }}>
        <Header title={t('canvasPreview.title')} back />
        <EmptyState icon="sparkles-outline" title={t('canvasPreview.emptyTitle')}
          description={t('canvasPreview.emptyBody')}
          action={t('canvasPreview.openStudio')} onPress={edit} />
      </Page>
    );

  const builder = draft.builderType;
  const byId: Record<string, CatalogComponent> = Object.fromEntries((result.data ?? []).map((entry) => [entry.id, entry]));
  const lines = componentLines(draft.placements, (id) => ({
    name: byId[id]?.name ?? t('studio.item'), price: byId[id]?.price ?? 0, imageUrl: byId[id]?.imageUrl,
  }));
  let signature = '';
  try { signature = canvasSignature(); } catch { /* Validated when continuing. */ }
  const saved = draft.saved?.userId === user?.id && draft.saved?.signature === signature ? draft.saved.product : null;
  // Chosen before the studio opened; the backend checks and prices it again on save.
  const packaging = gift ? draft.packaging : null;
  const color = packaging?.color ?? null;
  const closed = packaging?.type === 'OPAQUE';
  const total = saved?.price
    ?? (draft.base?.price ?? 0) + lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
      + choicePrice(packaging);
  const viewLabels = [t('giftStudio.packaging.inside'), t('giftStudio.packaging.packaged')];
  const texts = draft.texts.filter((layer) => layer.text.trim());
  const size = Math.min(width - 44, 360);
  const busy = intent !== null;

  async function save(order: boolean) {
    const current = useAuthStore.getState().user;
    if (!current) { router.push('/login'); return; }
    if (submitting.current) return;
    submitting.current = true;
    setIntent(order ? 'order' : 'save');
    setError('');
    try {
      const product = await saveCanvasDesign(current.id,
        () => capture(useCanvasStore.getState().placements.map((item) => byId[item.subCategoryId]?.imageUrl)),
        (formData) => createProduct(formData).unwrap());
      if (order) {
        useCommerceStore.getState().setCheckout(current.id, product);
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

  return (
    <Page
      style={{ maxWidth: 600, gap: 20 }}
      footer={
        <ActionFooter
          amount={total}
          amountLabel={saved ? t('canvasPreview.designTotal') : t('canvasPreview.estimatedTotal')}
          title={intent === 'order' ? t('canvasPreview.saving') : t('canvasPreview.continueToOrder')}
          onPress={() => void save(true)}
          loading={intent === 'order'}
          disabled={busy}
          caption={t('canvasPreview.caption')}
        />
      }
    >
      <Header title={t('canvasPreview.title')} back
        right={
          <TextAction title={saved ? t('canvasPreview.saved') : t('canvasPreview.saveForLater')} icon={saved ? 'checkmark' : 'bookmark-outline'}
            onPress={() => void save(false)} loading={intent === 'save'} disabled={busy || !!saved} />
        } />
      <FlowStep step={1} />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={[styles.stage, { width: size, height: size }]}>
          {/* Only the product is captured: backdrop, base, pieces and text; no controls. */}
          <View ref={ref} collapsable={false} testID="design-preview-canvas" style={{ width: size, height: size }}>
            <PhotoStage tone={builder} />
            <FreeDesignCanvas builder={builder} size={size} base={draft.base} placements={draft.placements}
              texts={texts} components={byId} editable={false} wrap={sceneWrap(packaging)} />
          </View>
          {closed && packagedView && packaging && <PackagedPreview packaging={packaging} size={size} />}
        </View>
        {closed && (
          <Chips options={viewLabels} value={viewLabels[packagedView ? 1 : 0]}
            onChange={(value) => setPackagedView(value === viewLabels[1])} />
        )}
        {packaging && (
          <Text style={ui.caption}>
            {color ? t('giftStudio.packaging.arrivesInColor', { name: packaging.name, color: color.name })
              : t('giftStudio.packaging.arrivesIn', { name: packaging.name })}
          </Text>
        )}
        <TextAction title={t('canvasPreview.editDesign')} icon="create-outline" onPress={edit} disabled={busy} />
      </View>

      <View style={{ gap: 2 }}>
        <Text style={styles.title}>{draft.base?.name ?? draft.categoryName}</Text>
        <Text style={ui.caption}>
          {[draft.base ? draft.categoryName : null, componentCount(t, draft.placements.length, builder)]
            .filter(Boolean).join(' · ')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={ui.label}>{builder === 'BOUQUET' ? t('canvasPreview.components') : t('canvasPreview.items')}</Text>
        {draft.base && (
          <View style={styles.line}>
            <View style={styles.thumb}>
              <CatalogImage imageUrl={draft.base.imageUrl} name={draft.base.name} size={34} />
            </View>
            <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{draft.base.name}</Text>
            <Text style={styles.amount}>{money(draft.base.price)}</Text>
          </View>
        )}
        {lines.map((line) => (
          <View key={line.subCategoryId} style={styles.line}>
            <View style={styles.thumb}>
              <CatalogImage imageUrl={line.imageUrl} name={line.name} size={34} />
            </View>
            <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{line.quantity} × {line.name}</Text>
            <Text style={styles.amount}>{money(line.quantity * line.unitPrice)}</Text>
          </View>
        ))}
        {packaging && (
          <View style={styles.line}>
            <View style={styles.thumb}>
              <CatalogImage imageUrl={color?.imageUrl ?? packaging.imageUrl} name={packaging.name} size={34} />
            </View>
            <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>
              {t('giftStudio.packaging.packagingPrice')} · {packaging.name}
            </Text>
            <Text style={styles.amount}>{money(packaging.price)}</Text>
          </View>
        )}
        {color && (
          <View style={styles.line}>
            <View style={[styles.thumb, { backgroundColor: color.hex, borderWidth: 1, borderColor: styles.divider.backgroundColor }]} />
            <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>
              {t('giftStudio.packaging.colorPrice')} · {color.name}
            </Text>
            <Text style={styles.amount}>{money(color.priceAdjustment)}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.line}>
          <Text style={[ui.label, { flex: 1 }]}>{t('common.total')}</Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
      </View>

      {texts.length > 0 && (
        <View style={styles.card}>
          <Text style={ui.label}>{t('canvasPreview.personalization')}</Text>
          {texts.map((layer) => (
            <Text key={layer.id} style={styles.quote}>“{layer.text.trim()}”</Text>
          ))}
          <Text style={ui.caption}>{t('canvasPreview.includedFree')}</Text>
        </View>
      )}

      <Field label={t('canvasPreview.nameLabel')} value={draft.name} onChangeText={draft.rename}
        editable={!busy} maxLength={150} />
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    stage: {
      borderRadius: 28, overflow: 'hidden', backgroundColor: c.thumbnail, borderWidth: 1, borderColor: c.border,
    },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    card: { gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    thumb: {
      width: 40, height: 40, borderRadius: 10, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    amount: { color: c.text, fontSize: 14, fontWeight: '600' },
    divider: { height: 1, backgroundColor: c.border },
    total: { color: c.text, fontSize: 18, fontWeight: '700' },
    quote: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 17, fontStyle: 'italic' },
  });
};
