import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Header, Icon, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { DesignItem } from '@/components/designer/DesignItem';
import { BeadPicker } from '@/components/designer/BeadPicker';
import { CategoryBeadPicker } from '@/components/designer/CategoryBeadPicker';
import { useDesignStore } from '@/store/designStore';
import { saveCurrentDesign } from '@/services/savedDesign';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useAuthStore } from '@/store/authStore';
import { itemById, productById } from '@/services/catalog';
import { type Theme } from '@/constants/theme';
import { designPrice, money } from '@/helper/pricing';
import { nearestBead, ringLayout } from '@/helper/design';
import { CustomizationItem } from '@/types/models';
import { useDesignPreviewCapture } from '@/hooks/useDesignPreviewCapture';
import { ReorderGestureLayer } from './components/ReorderGestureLayer';
import { StageOverlay } from './components/StageOverlay';
import { BeadSequence, SelectionToolbar } from './components/BeadSequence';
import { DesignerFooter } from './components/DesignerFooter';
import { StageBackground } from './components/StageBackground';

type Rect = { x: number; y: number; width: number; height: number };

const STAGE_MARGIN = 16;

export default function DesignerScreen() {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);

  const design = useDesignStore();
  const limit = design.selectedSize?.maxItems ?? Infinity;
  const limitMessage = design.selectedSize ? `${design.selectedSize.name} supports up to ${limit} components.` : '';
  const sizeLabel = design.selectedSize ? `${design.selectedSize.name} • ${design.selectedSize.measurement} ${design.selectedSize.unit}` : design.size;
  const [message, setMessage, setInlineMessage] = useFeedbackState('info');
  const [saving, setSaving] = useState(false);
  const [createProduct] = useCreateProductMutation();
  const savingRef = useRef(false);
  const [reorderingItem, setReorderingItem] = useState<CustomizationItem | null>(null);
  const [draggingItem, setDraggingItem] = useState<CustomizationItem | null>(null);
  const canvasRef = useRef<View>(null);
  const { ref: jewelryRef, exporting, capture } = useDesignPreviewCapture();
  const screenRef = useRef<View>(null);
  const canvasRect = useRef<Rect | null>(null);
  const jewelryRect = useRef<Rect | null>(null);
  const dragActive = useRef(false);
  const suppressPickUntil = useRef<{ id: string; time: number } | null>(null);
  const reorderId = useRef<string | null>(null);
  const suppressCanvasTapUntil = useRef(0);
  const reorderRect = useRef<Rect | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const screenX = useSharedValue(0);
  const screenY = useSharedValue(0);
  const reorderVisible = useSharedValue(0);
  const dragStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - screenX.value - 36 },
      { translateY: dragY.value - screenY.value - 36 },
    ],
  }));
  const reorderStyle = useAnimatedStyle(() => ({
    opacity: reorderVisible.value,
    transform: [
      { translateX: dragX.value - screenX.value - 24 },
      { translateY: dragY.value - screenY.value - 24 },
    ],
  }));
  const { width, height } = useWindowDimensions();
  // A square stage that uses the full width but leaves room for the bead picker.
  const stageSize = Math.min(Math.min(width, 760) - STAGE_MARGIN * 2, height * 0.46, 460);
  const jewelrySize = stageSize;
  const product = productById[design.productId];
  const DetailPicker = product.categoryId ? CategoryBeadPicker : BeadPicker;
  const selectedIndex = design.items.findIndex((item) => item.id === design.selectedId);
  const full = design.items.length >= limit;
  // Hit-testing must use the same auto-zoom the canvas draws with.
  const layoutFor = (count: number) => ringLayout(count, product.type, design.selectedSize?.maxItems);
  function startReorder(x: number, y: number) {
    reorderId.current = null;
    setReorderingItem(null);
    reorderRect.current = null;
    jewelryRef.current?.measureInWindow((left, top, width, height) => {
      const state = useDesignStore.getState();
      const layout = layoutFor(state.items.length);
      const point = { x: (x - left) * 320 / width, y: (y - top) * 320 / height };
      const nearest = nearestBead(point, state.items.length, product.type, layout);
      const entry = state.items[nearest.index];
      if (!entry || nearest.distance > Math.max(32, layout.beadRadius * 1.6)) return;
      reorderId.current = entry.id;
      setReorderingItem(itemById[entry.itemId]);
      reorderRect.current = { x: left, y: top, width, height };
      dragX.value = x;
      dragY.value = y;
      reorderVisible.value = 1;
      screenRef.current?.measureInWindow((screenLeft, screenTop) => {
        screenX.value = screenLeft;
        screenY.value = screenTop;
      });
    });
  }
  function finishReorder(x: number, y: number, canceled: boolean) {
    reorderVisible.value = 0;
    if (reorderId.current) suppressCanvasTapUntil.current = Date.now() + 400;
    setReorderingItem(null);
    const id = reorderId.current;
    const rect = reorderRect.current;
    reorderId.current = null;
    if (canceled || !id || !rect || x < rect.x || x > rect.x + rect.width ||
      y < rect.y || y > rect.y + rect.height) return;
    const state = useDesignStore.getState();
    const point = { x: (x - rect.x) * 320 / rect.width, y: (y - rect.y) * 320 / rect.height };
    state.placeItem(id, nearestBead(point, state.items.length, product.type,
      layoutFor(state.items.length)).index);
    state.select(id);
    setInlineMessage('Detail moved. Hold and drag it again to adjust its position.');
  }
  function moveReorder(x: number, y: number) {
    if (reorderId.current) moveDrag(x, y);
  }
  function startDrag(item: CustomizationItem, x: number, y: number) {
    dragActive.current = true;
    suppressPickUntil.current = { id: item.id, time: Date.now() + 500 };
    jewelryRect.current = null;
    dragX.value = x;
    dragY.value = y;
    screenRef.current?.measureInWindow((left, top) => {
      screenX.value = left;
      screenY.value = top;
    });
    canvasRef.current?.measureInWindow((left, top, width, height) => {
      canvasRect.current = { x: left, y: top, width, height };
    });
    jewelryRef.current?.measureInWindow((left, top, width, height) => {
      jewelryRect.current = { x: left, y: top, width, height };
    });
    setDraggingItem(item);
    setInlineMessage('');
  }
  function moveDrag(x: number, y: number) {
    dragX.value = x;
    dragY.value = y;
  }
  function finishDrag(item: CustomizationItem, x: number, y: number, canceled: boolean) {
    if (!dragActive.current) return;
    dragActive.current = false;
    setDraggingItem(null);
    const rect = canvasRect.current;
    if (canceled || !rect || x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height) return;
    const state = useDesignStore.getState();
    const piece = jewelryRect.current ?? rect;
    const point = { x: (x - piece.x) * 320 / piece.width, y: (y - piece.y) * 320 / piece.height };
    if (state.selectedId) {
      state.replaceItemAt(state.selectedId, item.id);
      setInlineMessage(`${item.name} replaced the selected detail.`);
      return;
    }
    const current = layoutFor(state.items.length);
    const nearest = nearestBead(point, state.items.length, product.type, current);
    const target = state.items[nearest.index];
    if (target && nearest.distance < Math.max(12, current.beadRadius * 1.1)) {
      state.replaceItemAt(target.id, item.id);
      setInlineMessage(`${item.name} replaced a detail on your ${product.type}.`);
      return;
    }
    if (state.items.length >= limit) { setInlineMessage(limitMessage + ' Drag onto an existing detail to replace it.'); return; }
    // Insert where the new bead would sit once the strand has one more bead.
    const slot = nearestBead(point, state.items.length + 1, product.type,
      layoutFor(state.items.length + 1));
    state.insertItem(item.id, slot.index);
    setInlineMessage(`${item.name} added to your ${product.type}.`);
  }
  async function save() {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true);
    toast.info('Saving your design. Please wait for confirmation before continuing.');
    try {
      const saved = await saveCurrentDesign(user.id, () =>
        capture(useDesignStore.getState().items), (formData) => createProduct(formData).unwrap());
      setMessage(`Saved to My Designs. ${saved.itemCount} beads · ${money(saved.price)}. Stock is not reserved. Next, preview your creation and review your order.`, 'success');
    } catch (error) {
      const message = apiError(error).message;
      setMessage(message + ' Your design is still here. Check the issue, then save again.', 'error');
    }
    finally { savingRef.current = false; setSaving(false); }
  }
  const hint = design.selectedId
    ? 'Tap a bead below to swap this one, or use the arrows to move it.'
    : full
      ? 'Your piece is complete. Tap a bead on it to swap or remove it.'
      : design.items.length
        ? 'Hold and drag a bead on your piece to reposition it. Tap to select.'
        : 'Tap a bead below, or hold and drag it onto your piece.';
  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}>
        <View style={styles.headerWrap}><Header
          title="Your creative studio"
          subtitle={[product.name, sizeLabel].filter(Boolean).join(' • ')}
          back
          right={
            <IconButton
              name="bookmark-outline"
              label="Save design"
              onPress={save}
              disabled={!design.items.length || saving}
            />
          }
        /></View>
        <View ref={canvasRef} collapsable={false}
          style={[styles.stage, { width: stageSize, height: stageSize }, draggingItem && styles.dragTarget]}>
          <StageBackground />
          <View pointerEvents="box-none" style={styles.jewelryLayer}>
            <ReorderGestureLayer enabled={design.items.length > 0}
              onStart={startReorder} onMove={moveReorder} onEnd={finishReorder}>
              <View ref={jewelryRef} collapsable={false} testID="design-preview-canvas"
                style={{ width: jewelrySize, height: jewelrySize, backgroundColor: 'transparent' }}>
              <JewelryCanvas
                exportMode={exporting}
                items={design.items}
                type={product.type}
                size={jewelrySize}
                capacity={design.selectedSize?.maxItems}
                selectedId={design.selectedId}
                onSelect={(id) => {
                  if (Date.now() >= suppressCanvasTapUntil.current)
                    design.select(id === design.selectedId ? null : id);
                }}
              />
              </View>
            </ReorderGestureLayer>
          </View>
          {!design.items.length && !product.categoryId && (
            <>
              {[0, 1].map((index) => (
                <Pressable key={index} accessibilityRole="button"
                  accessibilityLabel={`Add suggested bead ${itemById[product.palette[index]].name}`}
                  onPress={() => design.addItem(product.palette[index])}
                  style={[styles.quickAdd, index === 0
                    ? { left: stageSize * 0.2 - 18 }
                    : { right: stageSize * 0.2 - 18 }]}>
                  <Icon name="add" size={20} color={theme.colors.text} />
                </Pressable>
              ))}
            </>
          )}
          {draggingItem && <View pointerEvents="none" style={styles.dropOverlay} />}
          <StageOverlay
            label={[product.type.toUpperCase(), design.selectedSize?.name.toUpperCase()]
              .filter(Boolean).join(' · ')}
            counter={design.selectedSize ? `${design.items.length} / ${limit} beads` : `${design.items.length} components`}
            full={full}
            progress={design.selectedSize ? design.items.length / limit : undefined}
            onUndo={design.undo}
            onRedo={design.redo}
            canUndo={design.historyIndex !== 0}
            canRedo={design.historyIndex !== design.history.length - 1}
            onClear={() => {
              design.clear();
              setMessage('Canvas cleared. Tap Undo to bring it back.');
            }}
            canClear={design.items.length > 0}
          />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {design.selectedId ? (
          <SelectionToolbar
            name={itemById[design.items[selectedIndex].itemId].name}
            canMoveLeft={selectedIndex > 0}
            canMoveRight={selectedIndex < design.items.length - 1}
            onMove={design.moveItem}
            onRemove={design.removeItem}
            onClose={() => design.select(null)}
          />
        ) : (
          <View style={styles.hint}>
            <Icon name={full ? 'checkmark-circle-outline' : 'sparkles-outline'} size={16}
              color={theme.colors.accent} />
            <Text style={[ui.caption, { flex: 1 }]}>{hint}</Text>
          </View>
        )}
        {!!design.items.length && (
          <BeadSequence items={design.items} selectedId={design.selectedId} onSelect={design.select} />
        )}
        {message ? <Notice text={message} /> : null}
        <View style={styles.divider} />
        <DetailPicker
          key={product.categoryId ?? 'local'}
          categoryId={product.categoryId ?? ''}
          replacing={!!design.selectedId}
          disabled={full && !design.selectedId}
          onPick={(item) => {
            if (dragActive.current ||
              (suppressPickUntil.current?.id === item.id && Date.now() < suppressPickUntil.current.time)) return;
            setMessage('');
            const state = useDesignStore.getState();
            if (state.selectedId) state.replaceItem(item.id);
            else if (state.items.length >= limit) toast.info(limitMessage + ' Hold and drag onto an existing detail to replace it.');
            else state.addItem(item.id);
          }}
          onDragStart={startDrag}
          onDragMove={moveDrag}
          onDragEnd={finishDrag}
        />
        </ScrollView>
      </Page>
      {draggingItem && (
        <Animated.View pointerEvents="none" testID="drag-preview" style={[styles.dragPreview, dragStyle]}>
          <DesignItem item={draggingItem} size={52} />
        </Animated.View>
      )}
      <Animated.View pointerEvents="none" testID="reorder-preview" style={[styles.reorderPreview, reorderStyle]}>
        {reorderingItem && <DesignItem item={reorderingItem} size={48} />}
      </Animated.View>
      <DesignerFooter
        total={designPrice(product.basePrice, design.items)}
        beads={design.items.length}
        disabled={!design.items.length}
        onPreview={() => router.push('/preview')}
      />
    </View>
  );
}
const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingVertical: 8 },
    editorContent: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 32, gap: 12 },
    stage: {
      position: 'relative',
      alignSelf: 'center',
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: c.thumbnail,
      borderWidth: 1,
      borderColor: c.border,
    },
    jewelryLayer: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center', justifyContent: 'center',
    },
    dragTarget: { borderColor: c.accent },
    dropOverlay: { ...StyleSheet.absoluteFill, backgroundColor: c.accent + '20' },
    hint: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12,
      backgroundColor: c.soft,
    },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 2 },
    quickAdd: {
      position: 'absolute', top: '50%', marginTop: -18,
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.badge,
      borderWidth: 1, borderColor: c.border,
    },
    dragPreview: {
      position: 'absolute', left: 0, top: 0, width: 72, height: 72,
      borderRadius: 36, backgroundColor: 'transparent',
      borderColor: c.accent, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.25,
      shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    },
    reorderPreview: {
      position: 'absolute', left: 0, top: 0, width: 48, height: 48,
      borderRadius: 24, backgroundColor: 'transparent',
      borderColor: c.accent, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
  });
};
