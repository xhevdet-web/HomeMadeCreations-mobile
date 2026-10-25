import { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chips, Field, Header, IconButton, Notice, Page, useUI } from '@/components/common/ui';
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
import { isSized } from '@/api/apparelModels';
import { clampInside, TEXT_BOX } from '@/helper/canvasStudio';
import { TextTool } from '@/screen/CreativeStudio/components/TextTool';
import { type Theme } from '@/constants/theme';
import { ApparelCanvas, type DesignInfo } from './components/ApparelCanvas';
import { DesignPicker } from './components/DesignPicker';
import { DesignToolbar, SideSwitch } from './components/StudioControls';
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
  const { category, categoryResult, base, look, size: pieceSize, color, price } = useApparelSelection(categoryId);
  const designsResult = useApiResult<CatalogComponent[]>(useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  const [createProduct] = useCreateProductMutation();
  const [message, setMessage] = useFeedbackState('info');
  const [busy, setBusy] = useState<'save' | 'review' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState<CatalogComponent | null>(null);
  // The tray shows catalog designs, or the text tool (like the Gift studio).
  const [tray, setTray] = useState<'Designs' | 'Text'>('Designs');
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
  const area = printAreaFor(look, draft.side);
  const sidePlacements = draft.placements.filter((item) => item.side === draft.side);
  const selected = draft.placements.find((item) => item.id === draft.selectedId);
  const sideTexts = draft.texts.filter((layer) => layer.side === draft.side);
  const selectedText = draft.texts.find((layer) => layer.id === draft.selectedId) ?? null;
  const activeTray = selectedText ? 'Text' : tray;
  const byId = Object.fromEntries(allDesigns.map((design) => [design.id, design]));
  const info: Record<string, DesignInfo> = Object.fromEntries(
    allDesigns.map((design) => [design.id, { imageUrl: design.imageUrl, name: design.name }]));
  const uploads = draft.placements.filter((item) => item.imageUri).length;
  const usage: Record<string, number> = {};
  for (const item of draft.placements) usage[item.subCategoryId] = (usage[item.subCategoryId] ?? 0) + 1;
  const counts = {
    FRONT: [...draft.placements, ...draft.texts].filter((item) => item.side === 'FRONT').length,
    BACK: [...draft.placements, ...draft.texts].filter((item) => item.side === 'BACK').length,
  };
  // The base product must be chosen, and a sized one needs its size.
  const missingPiece = !base ? 'Choose your base' : isSized(base) && !pieceSize ? 'Choose a size' : null;
  const summary = [base?.color, pieceSize].filter(Boolean).join(' · ');
  // Catalog designs are priced each; own uploads cost the own-design price once.
  const total = apparelTotal(price, draft.placements.filter((item) => !item.imageUri),
    (id) => byId[id]?.price ?? 0) + (uploads && ownDesign ? ownDesign.price : 0);
  const changePiece = () => category && router.push({ pathname: '/apparel-base',
    params: { categoryId: category.id, edit: '1' } });

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
    // quality 1 keeps the original file: compressing would turn a PNG into a JPEG.
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    // Printed artwork must be PNG (it keeps a transparent background); the API checks it too.
    if (!isPng(asset)) {
      toast.error('Only PNG images can be uploaded. Save your design as a .png file and try again.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      toast.error('That image is larger than 5 MB. Choose a smaller one.');
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
    if (missingPiece) {
      toast.info(`${missingPiece} first.`);
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

  // Text stays inside the print area: its box spans 90% of the area's width at scale 1.
  const textBox = { width: 0.9, height: 0.9 * (TEXT_BOX.height / TEXT_BOX.width) * (area.width / area.height) };
  const fitText = (next: { x: number; y: number; scale: number; rotation: number }) =>
    clampInside(next, textBox, { left: 0, top: 0, right: 1, bottom: 1 });

  const step = (patch: { scale?: number; rotation?: number }) => {
    if (selectedText) {
      draft.updateText(selectedText.id, fitText({
        ...selectedText,
        scale: selectedText.scale * (patch.scale ?? 1),
        rotation: selectedText.rotation + (patch.rotation ?? 0),
      }));
      return;
    }
    if (!selected) return;
    draft.update(selected.id, {
      scale: patch.scale !== undefined ? selected.scale * patch.scale : undefined,
      rotation: patch.rotation !== undefined ? selected.rotation + patch.rotation : undefined,
    }, area);
  };

  // Text alone (a name, a date) is a complete design too.
  const designCount = draft.placements.length + draft.texts.length;
  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}
        footer={
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.footerInner}>
              <View style={{ flex: 1 }}>
                <Text style={ui.caption} numberOfLines={1}>
                  {designCount ? `${base?.name ?? 'Piece'} + ${designCount} design${designCount === 1 ? '' : 's'}`
                    : 'Add a logo, graphic, text or your own artwork'}
                </Text>
                <Text style={styles.total}>{money(total)}</Text>
              </View>
              <Button title={busy === 'review' ? 'Saving…' : 'Review order'} icon="arrow-forward"
                onPress={() => void save(true)} loading={busy === 'review'} disabled={!!busy || !designCount} />
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
          accessibilityLabel={`${base?.name ?? 'Piece'}, ${summary || missingPiece || ''}, ${money(price)}. Change`}
          onPress={changePiece} style={({ pressed }) => [styles.product, { opacity: pressed ? 0.8 : 1 }]}>
          <View style={styles.productPhoto}>
            <CatalogImage imageUrl={base?.imageUrl} name={base?.name ?? 'Piece'} size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>{base?.name ?? 'Choose your piece'}</Text>
            <View style={styles.productMeta}>
              {!!base?.colorHex && <View style={[styles.swatch, { backgroundColor: base.colorHex }]} />}
              <Text style={ui.caption} numberOfLines={1}>{missingPiece ?? summary}</Text>
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
              piece={look}
              side={draft.side}
              color={color}
              size={size}
              placements={sidePlacements}
              texts={sideTexts}
              designs={info}
              selectedId={draft.selectedId}
              exportMode={exporting}
              onSelect={draft.select}
              onChange={(id, patch) => draft.update(id, patch, area)}
              onRemove={draft.remove}
              onTextChange={(id, transform) => draft.updateText(id, fitText(transform))}
            />
          </View>
          {!exporting && (
            <>
              <View style={styles.sideOverlay} pointerEvents="box-none">
                <SideSwitch side={draft.side} counts={counts} onChange={draft.setSide} />
              </View>
              <View style={styles.history} pointerEvents="box-none">
                <IconButton name="trash-outline" label={`Clear the ${draft.side.toLowerCase()}`}
                  onPress={draft.clearSide} disabled={!sidePlacements.length && !sideTexts.length} />
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
          {(selected || selectedText) && (
            <DesignToolbar
              name={selectedText ? `“${selectedText.text}”` : byId[selected!.subCategoryId]?.name ?? 'Design'}
              onSmaller={() => step({ scale: 0.9 })}
              onLarger={() => step({ scale: 1.1 })}
              onRotateLeft={() => step({ rotation: -15 })}
              onRotateRight={() => step({ rotation: 15 })}
              onCenter={() => (selectedText
                ? draft.updateText(selectedText.id, fitText({ ...selectedText, x: 0.5, y: 0.5 }))
                : draft.update(selected!.id, { x: 0.5, y: 0.5 }, area))}
              onRemove={() => draft.selectedId && draft.remove(draft.selectedId)}
              onDone={() => draft.select(null)}
            />
          )}
          <Chips options={['Designs', 'Text']} value={activeTray}
            onChange={(value) => {
              setTray(value as 'Designs' | 'Text');
              if (selectedText && value !== 'Text') draft.select(null);
            }} />
          {activeTray === 'Text' ? (
            // Text is printed on the side shown, inside its print area; it is never priced.
            <TextTool
              selected={selectedText}
              count={draft.texts.length}
              onAdd={(text, { scale, ...style }) => draft.addText(text, { ...style, ...fitText({
                x: 0.5, y: 0.5 + (sideTexts.length % 3) * 0.18, scale, rotation: 0 }) })}
              onChange={(patch, record) => selectedText && draft.updateText(selectedText.id,
                patch.scale === undefined ? patch : { ...patch, ...fitText({ ...selectedText, ...patch }) }, record)}
              onRemove={() => selectedText && draft.remove(selectedText.id)}
              onDone={() => draft.select(null)}
            />
          ) : designsResult.loading || designsResult.error ? (
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
          {!selected && !selectedText && activeTray === 'Designs' && (
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

/** A picked image is PNG by its type, else by its file name. */
function isPng(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return asset.mimeType.toLowerCase() === 'image/png';
  return /\.png$/i.test(asset.fileName ?? asset.uri.split('?')[0]);
}
