import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { ReactElement, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Icon, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { DesignItem } from '@/components/designer/DesignItem';
import { BeadPicker } from '@/components/designer/BeadPicker';
import { CategoryBeadPicker } from '@/components/designer/CategoryBeadPicker';
import { useDesignStore } from '@/store/designStore';
import { saveCurrentDesign } from '@/services/savedDesign';
import { useAuthStore } from '@/store/authStore';
import { itemById, productById } from '@/services/catalog';
import { type Theme } from '@/constants/theme';
import { designPrice, money } from '@/helper/pricing';
import { angleFromPoint, itemPosition } from '@/helper/design';
import { CustomizationItem } from '@/types/models';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDesignPreviewCapture } from '@/hooks/useDesignPreviewCapture';

type Rect = { x: number; y: number; width: number; height: number };

function ReorderGestureLayer({ children, enabled, onStart, onMove, onEnd }: {
  children: ReactElement;
  enabled: boolean;
  onStart: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: (x: number, y: number, canceled: boolean) => void;
}) {
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(180).runOnJS(true)
    .enabled(enabled)
    .onStart((event) => onStart(event.absoluteX, event.absoluteY))
    .onUpdate((event) => onMove(event.absoluteX, event.absoluteY))
    .onFinalize((event, success) => onEnd(event.absoluteX, event.absoluteY, !success)),
  [enabled, onStart, onMove, onEnd]);
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}

export default function DesignerScreen() {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);

  const design = useDesignStore();
  const limit = design.selectedSize?.maxItems ?? Infinity;
  const limitMessage = design.selectedSize ? `${design.selectedSize.name} supports up to ${limit} components.` : '';
  const sizeLabel = design.selectedSize ? `${design.selectedSize.name} \u2022 ${design.selectedSize.measurement} ${design.selectedSize.unit}` : design.size;
  const [message, setMessage, setInlineMessage] = useFeedbackState('info');
  const [saving, setSaving] = useState(false);
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
  const { width } = useWindowDimensions();
  const stageWidth = Math.min(width, 760);
  const stageHeight = stageWidth * 2 / 3;
  const jewelrySize = Math.min(stageHeight - 8, 360);
  const product = productById[design.productId];
  const DetailPicker = product.categoryId ? CategoryBeadPicker : BeadPicker;
  const selectedIndex = design.items.findIndex((item) => item.id === design.selectedId);
  function startReorder(x: number, y: number) {
    reorderId.current = null;
    setReorderingItem(null);
    reorderRect.current = null;
    jewelryRef.current?.measureInWindow((left, top, width, height) => {
      const state = useDesignStore.getState();
      const point = { x: (x - left) * 320 / width, y: (y - top) * 320 / height };
      const nearest = state.items.map((entry, index) => {
        const position = itemPosition(index, state.items.length, product.type, entry.angle);
        return { entry, distance: Math.hypot(point.x - position.x, point.y - position.y) };
      }).sort((a, b) => a.distance - b.distance)[0];
      if (!nearest || nearest.distance > 32) return;
      reorderId.current = nearest.entry.id;
      setReorderingItem(itemById[nearest.entry.itemId]);
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
    state.placeItem(id, angleFromPoint(point.x, point.y, product.type));
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
    const nearest = state.items.map((entry, index) => {
      const position = itemPosition(index, state.items.length, product.type, entry.angle);
      return { entry, distance: Math.hypot(point.x - position.x, point.y - position.y) };
    }).sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance < 22) {
      state.replaceItemAt(nearest.entry.id, item.id);
      setInlineMessage(`${item.name} replaced a detail on your ${product.type}.`);
      return;
    }
    if (state.items.length >= limit) { setInlineMessage(limitMessage + ' Drag onto an existing detail to replace it.'); return; }
    const slots = Array.from({ length: state.items.length + 1 }, (_, index) => {
      const position = itemPosition(index, state.items.length + 1, product.type);
      return { index, distance: Math.hypot(point.x - position.x, point.y - position.y) };
    });
    slots.sort((a, b) => a.distance - b.distance);
    state.insertItem(item.id, slots[0].index, angleFromPoint(point.x, point.y, product.type));
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
        capture(useDesignStore.getState().items));
      setMessage(`Saved to My Designs. ${saved.itemCount} beads · ${money(saved.price)}. Stock is not reserved. Next, preview your creation and review your order.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save design.';
      setMessage(message + ' Your design is still here. Check the issue, then save again.', 'error');
    }
    finally { savingRef.current = false; setSaving(false); }
  }
  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}>
        <View style={styles.headerWrap}><Header
          title="Your creative studio"
          subtitle={[product.name, sizeLabel].filter(Boolean).join(' \u2022 ')}
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
          style={[styles.canvas, { width: stageWidth, height: stageHeight }, draggingItem && styles.dragTarget]}>
          <View pointerEvents="none" style={styles.imageLayer}>
            <Image
              source={theme.mode === 'dark'
                ? require('../../assets/darkModeBackground.png')
                : require('../../assets/lightModeBackground.png')}
              resizeMode="contain"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <View pointerEvents="box-none" style={styles.jewelryLayer}>
            <ReorderGestureLayer enabled={design.items.length > 0}
              onStart={startReorder} onMove={moveReorder} onEnd={finishReorder}>
              <View ref={jewelryRef} collapsable={false} testID="design-preview-canvas"
                style={{ width: jewelrySize, height: jewelrySize, backgroundColor: exporting ? 'transparent' : theme.colors.background }}>
              <JewelryCanvas
                exportMode={exporting}
                items={design.items}
                type={product.type}
                size={jewelrySize}
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
                    ? { left: stageWidth * 0.2 - 18 }
                    : { right: stageWidth * 0.2 - 18 }]}>
                  <Icon name="add" size={20} color={theme.colors.text} />
                </Pressable>
              ))}
            </>
          )}
          {draggingItem && <View pointerEvents="none" style={styles.dropOverlay} />}
          <Text style={styles.stageLabel}>{product.type.toUpperCase()} STUDIO</Text>
          <Text style={styles.counter}>{design.selectedSize ? `${design.items.length} / ${limit} beads` : `${design.items.length} components`}</Text>
          <View style={styles.stageControls}>
            <IconButton name="arrow-undo-outline" label="Undo" onPress={design.undo}
              disabled={design.historyIndex === 0} />
            <IconButton name="arrow-redo-outline" label="Redo" onPress={design.redo}
              disabled={design.historyIndex === design.history.length - 1} />
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={ui.between}>
          <Text style={ui.caption}>
            {design.selectedId
              ? 'Tap a bead below to replace this detail.'
              : design.items.length
                ? 'Hold and drag a detail to reposition it. Tap to edit.'
                : 'Tap a bead below, or hold and drag it onto your piece.'}
          </Text>
          <Pressable
            disabled={!design.items.length}
            onPress={() => {
              design.clear();
              setMessage('Canvas cleared. Tap Undo to bring it back.');
            }}
            hitSlop={10}
          >
            <Text style={ui.textLink}>Clear</Text>
          </Pressable>
        </View>
        {!!design.items.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {design.items.map((entry, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  'Select position ' + (index + 1) + ', ' + itemById[entry.itemId].name
                }
                key={entry.id}
                onPress={() => design.select(entry.id === design.selectedId ? null : entry.id)}
                style={[
                  styles.selectedBead,
                  entry.id === design.selectedId && { borderColor: theme.colors.accent },
                ]}
              >
                <DesignItem item={itemById[entry.itemId]} size={34} />
                <Text style={styles.position}>{index + 1}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {design.selectedId && (
          <Animated.View entering={FadeIn.duration(180)} style={ui.between}>
            <Text style={[ui.caption, { flex: 1 }]}>
              {itemById[design.items[selectedIndex].itemId].name}
            </Text>
            <IconButton
              name="arrow-back"
              label="Move detail left"
              onPress={() => design.moveItem(-1)}
              disabled={selectedIndex <= 0}
            />
            <IconButton
              name="arrow-forward"
              label="Move detail right"
              onPress={() => design.moveItem(1)}
              disabled={selectedIndex >= design.items.length - 1}
            />
            <IconButton
              name="trash-outline"
              label="Remove selected detail"
              onPress={design.removeItem}
            />
            <IconButton name="close" label="Finish selecting" onPress={() => design.select(null)} />
          </Animated.View>
        )}
        {message ? <Notice text={message} /> : null}
        {design.items.length >= limit && !design.selectedId && (
          <Text style={ui.caption}>
            {limitMessage} Select a detail to replace or remove it.
          </Text>
        )}
        <DetailPicker
          key={product.categoryId ?? 'local'}
          categoryId={product.categoryId ?? ''}
          replacing={!!design.selectedId}
          disabled={design.items.length >= limit && !design.selectedId}
          onPick={(item) => {
            if (dragActive.current ||
              (suppressPickUntil.current?.id === item.id && Date.now() < suppressPickUntil.current.time)) return;
            setMessage('');
            const state = useDesignStore.getState();
            if (state.selectedId) state.replaceItem(item.id);
            else if (state.items.length >= limit) setMessage(limitMessage + ' Hold and drag onto an existing detail to replace it.');
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
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <View style={[ui.between, { width: '100%', maxWidth: 876, alignSelf: 'center' }]}>
          <View>
            <Text style={ui.caption}>Your creation</Text>
            <Text style={styles.total}>{money(designPrice(product.basePrice, design.items))}</Text>
          </View>
          <Button
            title="Preview"
            icon="arrow-forward"
            disabled={!design.items.length}
            onPress={() => router.push('/preview')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingVertical: 12 },
    editorContent: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 32, gap: 14 },
    canvas: {
      position: 'relative',
    },
    imageLayer: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
    },
    jewelryLayer: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center', justifyContent: 'center',
    },
    dragTarget: { opacity: 0.92 },
    dropOverlay: { ...StyleSheet.absoluteFill, backgroundColor: '#F9B17A20' },
    stageLabel: {
      position: 'absolute', top: 12, left: 12,
      fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
      color: theme.colors.text, backgroundColor: theme.colors.surface,
      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20,
    },
    stageControls: {
      position: 'absolute', right: 12, bottom: 12,
      flexDirection: 'row', gap: 8,
    },
    quickAdd: {
      position: 'absolute', top: '50%', marginTop: -18,
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.badge,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    dragPreview: {
      position: 'absolute', left: 0, top: 0, width: 72, height: 72,
      borderRadius: 36, backgroundColor: "transparent",
      borderColor: theme.colors.accent, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.25,
      shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    },
    reorderPreview: {
      position: 'absolute', left: 0, top: 0, width: 48, height: 48,
      borderRadius: 24, backgroundColor: 'transparent',
      borderColor: theme.colors.accent, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    counter: {
      position: 'absolute',
      top: 12, right: 12,
      fontSize: 10,
      letterSpacing: 1,
      color: theme.colors.text,
      backgroundColor: theme.colors.badge,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 20,
    },
    selectedBead: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 6,
      alignItems: 'center',
      minWidth: 48,
    },
    position: { color: theme.colors.muted, fontSize: 8 },
    bottom: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: 18,
      backgroundColor: theme.colors.bottomBar,
    },
    total: { color: theme.colors.text, fontSize: 26, fontWeight: '600', marginTop: 3 },
  });
};
