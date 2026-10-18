import { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Header, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogComponent } from '@/api/catalogModels';
import { CUSTOM_UPLOAD, MAX_CUSTOM_UPLOADS, type DesignSide } from '@/api/builderModels';
import { useApparelStore } from '@/store/apparelStore';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { apparelTotal, printAreaFor } from '@/helper/apparel';
import { money } from '@/helper/pricing';
import { captureViewPreview } from '@/services/designPreview';
import { saveApparelDesign } from '@/services/apparelDesign';
import { optionLabel } from '@/api/builderModels';
import { type Theme } from '@/constants/theme';
import { ApparelCanvas, type DesignInfo } from './components/ApparelCanvas';
import { DesignPicker } from './components/DesignPicker';
import { DesignToolbar, missingOption, SideSwitch } from './components/StudioControls';
import { useApparelSelection } from './useApparelSelection';

type Rect = { x: number; y: number; width: number; height: number };
const frames = (count: number) => new Promise<void>((resolve) => {
  const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());
  step(count);
});

export default function ApparelStudioScreen() {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width, height } = useWindowDimensions();
  const draft = useApparelStore();
  const categoryId = draft.categoryId ?? '';
  const { category, categoryResult, garment, variant, color, price } = useApparelSelection(categoryId);
  const designsResult = useApiResult<CatalogComponent[]>(useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  const [createProduct] = useCreateProductMutation();
  const [message, setMessage] = useFeedbackState('info');
  const [busy, setBusy] = useState<'save' | 'review' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState<CatalogComponent | null>(null);
  const canvasRef = useRef<View>(null);
  const screenRef = useRef<View>(null);
  const canvasRect = useRef<Rect | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const screenX = useSharedValue(0);
  const screenY = useSharedValue(0);
  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value - screenX.value - 36 }, { translateY: dragY.value - screenY.value - 36 }],
  }));

  const allDesigns = designsResult.data ?? [];
  // The admin's "Your own design" is offered as an upload, not as a catalog design.
  const ownDesign = allDesigns.find((design) => design.type?.toUpperCase() === CUSTOM_UPLOAD);
  const designs = allDesigns.filter((design) => design !== ownDesign);
  // Leave room below the canvas for the designs strip and tools.
  const size = Math.min(Math.min(width, 760) - 32, height * 0.4, 420);
  const area = printAreaFor(garment, draft.side);
  const sidePlacements = draft.placements.filter((item) => item.side === draft.side);
  const selected = draft.placements.find((item) => item.id === draft.selectedId);
  const byId = Object.fromEntries(allDesigns.map((design) => [design.id, design]));
  const info: Record<string, DesignInfo> = Object.fromEntries(
    allDesigns.map((design) => [design.id, { imageUrl: design.imageUrl, name: design.name }]));
  const uploads = draft.placements.filter((item) => item.imageUri).length;
  const usage: Record<string, number> = {};
  for (const item of draft.placements) usage[item.subCategoryId] = (usage[item.subCategoryId] ?? 0) + 1;
  const counts = {
    FRONT: draft.placements.filter((item) => item.side === 'FRONT').length,
    BACK: draft.placements.filter((item) => item.side === 'BACK').length,
  };
  const options = category?.options ?? [];
  const missing = missingOption(options, draft.selectedOptions);
  const summary = [variant?.colorName, variant?.size,
    ...options.map((option) => optionLabel(option, draft.selectedOptions[option.key]))]
    .filter(Boolean).join(' · ');
  // Catalog designs are priced each; own uploads cost the own-design price once.
  const total = apparelTotal(price, draft.placements.filter((item) => !item.imageUri),
    (id) => byId[id]?.price ?? 0) + (uploads && ownDesign ? ownDesign.price : 0);
  const changePiece = () => category && router.push({ pathname: '/apparel-options',
    params: { categoryId: category.id, garmentId: draft.garmentId ?? undefined, edit: '1' } });

  function addDesign(design: CatalogComponent, at?: { x: number; y: number }) {
    // Printed designs are unlimited; physical ones (patches) are limited by stock.
    if (design.trackStock !== false && (usage[design.id] ?? 0) >= design.stock) {
      toast.info(`All available ${design.name} designs are already on your piece.`);
      return;
    }
    draft.add(design.id, area, at);
    setMessage('');
  }

  async function uploadDesign() {
    if (!ownDesign || uploads >= MAX_CUSTOM_UPLOADS) return;
    // Opening the photo library needs no permission prompt (system picker).
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.92 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      toast.error('That image is larger than 5 MB. Choose a smaller one.');
      return;
    }
    if (asset.mimeType && !/^image\/(jpeg|png|webp)$/.test(asset.mimeType)) {
      toast.error('Use a JPEG, PNG or WebP image.');
      return;
    }
    draft.add(ownDesign.id, area, undefined, asset.uri);
    toast.info('Your design is on the piece. Drag, resize or rotate it inside the print area.');
  }

  // Long-press drag from the picker onto the garment.
  const drag = {
    onDragStart: (design: CatalogComponent, x: number, y: number) => {
      dragX.value = x;
      dragY.value = y;
      screenRef.current?.measureInWindow((left, top) => { screenX.value = left; screenY.value = top; });
      canvasRef.current?.measureInWindow((left, top, w, h) => { canvasRect.current = { x: left, y: top, width: w, height: h }; });
      setDragging(design);
    },
    onDragMove: (x: number, y: number) => { dragX.value = x; dragY.value = y; },
    onDragEnd: (design: CatalogComponent, x: number, y: number, canceled: boolean) => {
      setDragging(null);
      const rect = canvasRect.current;
      if (canceled || !rect) return;
      const px = (x - rect.x) / rect.width;
      const py = (y - rect.y) / rect.height;
      if (px < 0 || px > 1 || py < 0 || py > 1) return;
      // Drops anywhere on the garment snap inside the print area.
      addDesign(design, { x: (px - area.x) / area.width, y: (py - area.y) / area.height });
    },
  };

  async function captureSide(side: DesignSide) {
    const previous = useApparelStore.getState().side;
    useApparelStore.getState().setSide(side);
    setExporting(true);
    try {
      await frames(3);
      return await captureViewPreview(canvasRef.current, useApparelStore.getState().placements
        .filter((item) => item.side === side).map((item) => item.imageUri ?? byId[item.subCategoryId]?.imageUrl));
    } finally {
      setExporting(false);
      useApparelStore.getState().setSide(previous);
    }
  }

  async function save(review: boolean) {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (!category || busy) return;
    if (!variant || missing) {
      toast.info(!variant ? 'Choose a colour and size first.' : `Choose a ${missing!.name.toLowerCase()} first.`);
      changePiece();
      return;
    }
    setBusy(review ? 'review' : 'save');
    setMessage('');
    try {
      const product = await saveApparelDesign(user.id, category.id, captureSide,
        (formData) => createProduct(formData).unwrap());
      if (review) {
        useCommerceStore.getState().setCheckout(user.id, product);
        router.push('/checkout');
      } else {
        toast.success('Saved to My Designs.');
      }
    } catch (failure) {
      setMessage(apiError(failure).message + ' Your design is still here.', 'error');
    } finally {
      setBusy(null);
    }
  }

  if (!category)
    return (
      <Page>
        <Header title="Studio" back />
        {categoryId ? (
          <CatalogState loading={categoryResult.loading} error={categoryResult.error}
            empty="This category is unavailable." retry={categoryResult.retry} />
        ) : (
          <Text style={ui.body}>Choose a category to start designing.</Text>
        )}
      </Page>
    );

  const step = (patch: { scale?: number; rotation?: number }) => {
    if (!selected) return;
    draft.update(selected.id, {
      scale: patch.scale !== undefined ? selected.scale * patch.scale : undefined,
      rotation: patch.rotation !== undefined ? selected.rotation + patch.rotation : undefined,
    }, area);
  };

  const designCount = draft.placements.length;
  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}
        footer={
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.footerInner}>
              <View style={{ flex: 1 }}>
                <Text style={ui.caption} numberOfLines={1}>
                  {designCount ? `${garment?.name ?? 'Piece'} + ${designCount} design${designCount === 1 ? '' : 's'}`
                    : 'No designs yet — you can still order it plain'}
                </Text>
                <Text style={styles.total}>{money(total)}</Text>
              </View>
              <Button title={busy === 'review' ? 'Saving…' : 'Review order'} icon="arrow-forward"
                onPress={() => void save(true)} loading={busy === 'review'} disabled={!!busy} />
            </View>
          </SafeAreaView>
        }>
        <View style={styles.headerWrap}>
          <Header title="Design studio" back
            right={<IconButton name="bookmark-outline" label="Save design" onPress={() => void save(false)}
              disabled={!designCount || !!busy} />} />
        </View>
        {/* The piece being sold: what the customer is designing and paying for. */}
        <Pressable accessibilityRole="button"
          accessibilityLabel={`${garment?.name ?? 'Piece'}, ${summary || 'choose colour and size'}, ${money(price)}. Change`}
          onPress={changePiece} style={({ pressed }) => [styles.product, { opacity: pressed ? 0.8 : 1 }]}>
          <View style={styles.productPhoto}>
            <CatalogImage imageUrl={garment?.imageUrl ?? garment?.frontImageUrl} name={garment?.name ?? 'Garment'}
              size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>{garment?.name ?? 'Choose your piece'}</Text>
            <View style={styles.productMeta}>
              {variant && <View style={[styles.swatch, { backgroundColor: variant.colorValue }]} />}
              <Text style={ui.caption} numberOfLines={1}>{summary || 'Choose colour and size'}</Text>
            </View>
          </View>
          <Text style={styles.productPrice}>{money(price)}</Text>
          <Text style={ui.textLink}>Change</Text>
        </Pressable>

        <View style={[styles.stage, { width: size + 16, height: size + 16 }, dragging && styles.dropTarget]}>
          <StageBackground />
          <View ref={canvasRef} collapsable={false} testID="design-preview-canvas"
            style={{ width: size, height: size }}>
            <ApparelCanvas
              garment={garment}
              side={draft.side}
              color={color}
              size={size}
              placements={sidePlacements}
              designs={info}
              selectedId={draft.selectedId}
              exportMode={exporting}
              onSelect={draft.select}
              onChange={(id, patch) => draft.update(id, patch, area)}
              onRemove={draft.remove}
            />
          </View>
          {!exporting && (
            <>
              <View style={styles.sideOverlay} pointerEvents="box-none">
                <SideSwitch side={draft.side} counts={counts} onChange={draft.setSide} />
              </View>
              <View style={styles.history} pointerEvents="box-none">
                <IconButton name="trash-outline" label={`Clear the ${draft.side.toLowerCase()}`}
                  onPress={draft.clearSide} disabled={!sidePlacements.length} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <IconButton name="arrow-undo-outline" label="Undo" onPress={draft.undo}
                    disabled={draft.historyIndex === 0} />
                  <IconButton name="arrow-redo-outline" label="Redo" onPress={draft.redo}
                    disabled={draft.historyIndex >= draft.history.length - 1} />
                </View>
              </View>
            </>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {selected && (
            <DesignToolbar
              name={byId[selected.subCategoryId]?.name ?? 'Design'}
              onSmaller={() => step({ scale: 0.9 })}
              onLarger={() => step({ scale: 1.1 })}
              onRotateLeft={() => step({ rotation: -15 })}
              onRotateRight={() => step({ rotation: 15 })}
              onCenter={() => draft.update(selected.id, { x: 0.5, y: 0.5 }, area)}
              onRemove={() => draft.remove(selected.id)}
              onDone={() => draft.select(null)}
            />
          )}
          {/* The design tray: upload your own first, then the catalog designs. */}
          {designsResult.loading || designsResult.error ? (
            <CatalogState loading={designsResult.loading} error={designsResult.error}
              empty="" retry={designsResult.retry} />
          ) : (
            <DesignPicker layout="strip" designs={designs} usage={usage} onAdd={(design) => addDesign(design)}
              drag={drag}
              upload={ownDesign ? {
                price: ownDesign.price, used: uploads, disabled: uploads >= MAX_CUSTOM_UPLOADS,
                onPress: () => void uploadDesign(),
              } : undefined} />
          )}
          {!selected && (
            <Text style={ui.caption}>
              {sidePlacements.length
                ? 'Tap a design to select it. Drag to move; pinch or use the corner handle to resize and rotate.'
                : `Tap a design to add it to the ${draft.side === 'FRONT' ? 'front' : 'back'}. It stays inside the print area.`}
            </Text>
          )}
          {message ? <Notice text={message} /> : null}
          <Field label="Name your piece" value={draft.name} onChangeText={draft.rename} maxLength={150} />
        </ScrollView>
      </Page>
      {dragging && (
        <Animated.View pointerEvents="none" testID="drag-preview" style={[styles.ghost, ghostStyle]}>
          <CatalogImage imageUrl={dragging.imageUrl} name={dragging.name} size={60} />
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingTop: 4 },
    product: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 8,
      paddingVertical: 6, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    productPhoto: {
      width: 44, height: 44, borderRadius: 10, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    productName: { color: c.text, fontSize: 14, fontWeight: '600' },
    productMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    productPrice: { color: c.gold, fontSize: 14, fontWeight: '700' },
    sideOverlay: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center' },
    footer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bottomBar },
    footerInner: {
      flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', maxWidth: 760,
      alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10,
    },
    total: { color: c.text, fontSize: 20, fontWeight: '600' },
    stage: {
      alignSelf: 'center', borderRadius: 28, overflow: 'hidden', alignItems: 'center',
      justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.thumbnail,
    },
    dropTarget: { borderColor: c.accent },
    history: {
      position: 'absolute', left: 12, right: 12, bottom: 12,
      flexDirection: 'row', justifyContent: 'space-between',
    },
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 },
    swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: c.border },
    ghost: {
      position: 'absolute', left: 0, top: 0, width: 72, height: 72, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent,
      backgroundColor: c.badge,
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    },
  });
};
