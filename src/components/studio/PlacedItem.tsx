import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Icon } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';

export type Transform = { x: number; y: number; scale: number; rotation: number };
/** Pixel rectangle that x/y (0–1) are relative to: a print area, or the whole canvas. */
export type Frame = { left: number; top: number; width: number; height: number };

const HANDLE = 26;

/**
 * A freely placed studio item: drag to move, pinch/rotate with two fingers, or use the
 * corner handle with one finger (and a mouse). Live values stay on the UI thread and are
 * committed once a gesture ends; `clamp` keeps them inside the item's valid zone.
 */
export function PlacedItem({ transform, frame, width, height, clamp, label, name = label, selected, editable,
  fixed = false, zIndex, children, onSelect, onChange, onRemove }: {
  transform: Transform;
  frame: Frame;
  /** Box size in pixels at scale 1. */
  width: number;
  height: number;
  clamp: (next: Transform) => Transform;
  label: string;
  /** Short name for the remove/resize handles; defaults to `label`. */
  name?: string;
  selected: boolean;
  editable: boolean;
  /** Can be selected and removed, but not moved (e.g. a gift bag). */
  fixed?: boolean;
  /** Stacking among siblings; keeps one stable list so a lifted item is never remounted. */
  zIndex?: number;
  children: ReactNode;
  onSelect: () => void;
  onChange: (patch: Transform) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const x = useSharedValue(transform.x);
  const y = useSharedValue(transform.y);
  const scale = useSharedValue(transform.scale);
  const rotation = useSharedValue(transform.rotation);
  // Values when the current gesture started, and the corner handle's start vector.
  const origin = useSharedValue<Transform>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const handleFrom = useSharedValue({ dx: 0, dy: 0 });
  useEffect(() => {
    x.set(transform.x);
    y.set(transform.y);
    scale.set(transform.scale);
    rotation.set(transform.rotation);
  }, [transform.x, transform.y, transform.scale, transform.rotation, x, y, scale, rotation]);

  function apply(next: Transform) {
    const clamped = clamp(next);
    x.set(clamped.x);
    y.set(clamped.y);
    scale.set(clamped.scale);
    rotation.set(clamped.rotation);
  }
  function begin() {
    origin.set({ x: x.get(), y: y.get(), scale: scale.get(), rotation: rotation.get() });
  }
  function commit() {
    onChange({ x: x.get(), y: y.get(), scale: scale.get(), rotation: Math.round(rotation.get()) });
  }
  function move(translationX: number, translationY: number) {
    apply({
      ...origin.get(),
      x: origin.get().x + translationX / frame.width,
      y: origin.get().y + translationY / frame.height,
    });
  }
  function pinch(factor: number) {
    apply({ x: x.get(), y: y.get(), rotation: rotation.get(), scale: origin.get().scale * factor });
  }
  function turn(radians: number) {
    apply({ x: x.get(), y: y.get(), scale: scale.get(),
      rotation: origin.get().rotation + (radians * 180) / Math.PI });
  }
  function beginHandle() {
    begin();
    const radians = (rotation.get() * Math.PI) / 180;
    const halfX = (width * scale.get()) / 2;
    const halfY = (height * scale.get()) / 2;
    handleFrom.set({
      dx: halfX * Math.cos(radians) - halfY * Math.sin(radians),
      dy: halfX * Math.sin(radians) + halfY * Math.cos(radians),
    });
  }
  function moveHandle(translationX: number, translationY: number) {
    const from = handleFrom.get();
    const dx = from.dx + translationX;
    const dy = from.dy + translationY;
    const ratio = Math.hypot(dx, dy) / Math.max(Math.hypot(from.dx, from.dy), 1);
    const degrees = (Math.atan2(dy, dx) - Math.atan2(from.dy, from.dx)) * 180 / Math.PI;
    apply({ x: origin.get().x, y: origin.get().y, scale: origin.get().scale * ratio,
      rotation: origin.get().rotation + degrees });
  }

  const movable = editable && !fixed;
  const gesture = Gesture.Simultaneous(
    Gesture.Pan().runOnJS(true).minDistance(2).enabled(movable)
      .onBegin(() => onSelect())
      .onStart(() => begin())
      .onUpdate((event) => move(event.translationX, event.translationY))
      .onEnd(() => commit()),
    Gesture.Pinch().runOnJS(true).enabled(movable)
      .onStart(() => begin())
      .onUpdate((event) => pinch(event.scale))
      .onEnd(() => commit()),
    Gesture.Rotation().runOnJS(true).enabled(movable)
      .onStart(() => begin())
      .onUpdate((event) => turn(event.rotation))
      .onEnd(() => commit()),
    // Fixed items can't be dragged, so a tap selects them.
    Gesture.Tap().runOnJS(true).enabled(editable && fixed).onEnd(() => onSelect()),
  );
  const handleGesture = Gesture.Pan().runOnJS(true)
    .onStart(() => beginHandle())
    .onUpdate((event) => moveHandle(event.translationX, event.translationY))
    .onEnd(() => commit());

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: frame.left + x.value * frame.width - width / 2 },
      { translateY: frame.top + y.value * frame.height - height / 2 },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));
  // Handles keep a constant on-screen size however the item is scaled.
  const handleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 / scale.value }] }));
  const { t } = useTranslation();

  return (
    <Animated.View pointerEvents={editable ? 'auto' : 'none'} style={[styles.box, { width, height, zIndex }, style]}>
      <GestureDetector gesture={gesture}>
        <View accessible accessibilityRole="button"
          accessibilityLabel={selected ? t('studio.selected', { label }) : label}
          style={{ width, height }}>
          {children}
        </View>
      </GestureDetector>
      {selected && editable && (
        <>
          <View pointerEvents="none" style={[styles.outline, { borderColor: theme.colors.accent }]} />
          <Animated.View style={[styles.remove, handleStyle]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('studio.removeName', { name })} onPress={onRemove}
              hitSlop={8} style={[styles.handle, { backgroundColor: theme.colors.danger }]}>
              <Icon name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
          {!fixed && (
            <GestureDetector gesture={handleGesture}>
              <Animated.View accessibilityLabel={t('studio.resizeRotate', { name })}
                style={[styles.resize, handleStyle, styles.handle, { backgroundColor: theme.colors.primary }]}>
                <Icon name="expand-outline" size={13} color={theme.colors.onPrimary} />
              </Animated.View>
            </GestureDetector>
          )}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: 0 },
  outline: {
    position: 'absolute', inset: -3, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 6,
  },
  handle: {
    width: HANDLE, height: HANDLE, borderRadius: HANDLE / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  remove: { position: 'absolute', top: -HANDLE / 2, left: -HANDLE / 2 },
  resize: { position: 'absolute', bottom: -HANDLE / 2, right: -HANDLE / 2 },
});
