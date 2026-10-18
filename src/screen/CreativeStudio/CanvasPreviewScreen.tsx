import { useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState, Field, Header, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { TextAction } from '@/components/common/TextAction';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { FlowStep } from '@/components/checkout/FlowStep';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
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
import { DesignCanvas } from './components/DesignCanvas';
import { useCanvasCapture } from './components/useCanvasCapture';

/** A clean look at the finished bouquet or gift before it is saved and ordered. */
export default function CanvasPreviewScreen() {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const draft = useCanvasStore();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<CatalogComponent[]>(
    useGetCategoryComponentsQuery(draft.categoryId ?? '', { skip: !draft.categoryId }));
  const [createProduct] = useCreateProductMutation();
  const { ref, exporting, capture } = useCanvasCapture();
  const [intent, setIntent] = useState<'save' | 'order' | null>(null);
  const [error, setError] = useFeedbackState();
  const submitting = useRef(false);
  const edit = () => (router.canGoBack() ? router.back() : router.replace('/studio'));

  if (!draft.builderType || !draft.placements.length)
    return (
      <Page style={{ maxWidth: 600 }}>
        <Header title="Your design" back />
        <EmptyState icon="sparkles-outline" title="Nothing to preview yet"
          description="Add a few pieces in the studio, then come back to see your creation."
          action="Open the studio" onPress={edit} />
      </Page>
    );

  const builder = draft.builderType;
  const byId: Record<string, CatalogComponent> = Object.fromEntries((result.data ?? []).map((entry) => [entry.id, entry]));
  const lines = componentLines(draft.placements, (id) => ({
    name: byId[id]?.name ?? 'Item', price: byId[id]?.price ?? 0, imageUrl: byId[id]?.imageUrl,
  }));
  let signature = '';
  try { signature = canvasSignature(); } catch { /* Validated when continuing. */ }
  const saved = draft.saved?.userId === user?.id && draft.saved?.signature === signature ? draft.saved.product : null;
  const total = saved?.price ?? lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const texts = builder === 'GIFT' ? draft.texts.filter((layer) => layer.text.trim()) : [];
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
        toast.success('Saved to My Designs. Come back whenever you’re ready.');
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
          amountLabel={saved ? 'Design total' : 'Estimated total'}
          title={intent === 'order' ? 'Saving your design…' : 'Continue to order'}
          onPress={() => void save(true)}
          loading={intent === 'order'}
          disabled={busy}
          caption="Your design is saved when you continue. Stock is reserved when you order."
        />
      }
    >
      <Header title="Your design" back
        right={
          <TextAction title={saved ? 'Saved' : 'Save for later'} icon={saved ? 'checkmark' : 'bookmark-outline'}
            onPress={() => void save(false)} loading={intent === 'save'} disabled={busy || !!saved} />
        } />
      <FlowStep step={1} />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={[styles.stage, { width: size, height: size }]}>
          {!exporting && <StageBackground />}
          {/* Only the product is captured: no handles, zones, pickers or controls. */}
          <View ref={ref} collapsable={false} testID="design-preview-canvas" style={{ width: size, height: size }}>
            <DesignCanvas builder={builder} size={size} placements={draft.placements} texts={texts}
              components={byId} editable={false} />
          </View>
        </View>
        <TextAction title="Edit design" icon="create-outline" onPress={edit} disabled={busy} />
      </View>

      <View style={{ gap: 2 }}>
        <Text style={styles.title}>{draft.categoryName}</Text>
        <Text style={ui.caption}>
          {[draft.size?.name, componentCount(draft.placements.length, builder)].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={ui.label}>{builder === 'BOUQUET' ? 'Components' : 'Items'}</Text>
        {lines.map((line) => (
          <View key={line.subCategoryId} style={styles.line}>
            <View style={styles.thumb}>
              <CatalogImage imageUrl={line.imageUrl} name={line.name} size={34} />
            </View>
            <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{line.quantity} × {line.name}</Text>
            <Text style={styles.amount}>{money(line.quantity * line.unitPrice)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.line}>
          <Text style={[ui.label, { flex: 1 }]}>Total</Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
      </View>

      {texts.length > 0 && (
        <View style={styles.card}>
          <Text style={ui.label}>Personalization</Text>
          {texts.map((layer) => (
            <Text key={layer.id} style={styles.quote}>“{layer.text.trim()}”</Text>
          ))}
          <Text style={ui.caption}>Included free of charge.</Text>
        </View>
      )}

      <Field label="Give your creation a name" value={draft.name} onChangeText={draft.rename}
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
