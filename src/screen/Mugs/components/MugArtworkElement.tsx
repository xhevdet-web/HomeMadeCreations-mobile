import { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import type { CaseTransform, Size } from '@/helper/caseStudio';
import { clampElement, elementBox, type MugPrintArea } from '@/helper/mugs';
import { elementImage } from '@/services/mugDesign';
import type { MugElement } from '@/store/mugStore';

/**
 * One image on the flat print. Tap selects it; drag, pinch and rotate move it. A running
 * gesture is drawn from local state and saved once it ends (one undo step), so the other
 * images never re-render while it moves.
 */
export const MugArtworkElement = memo(function MugArtworkElement({ element, area, width, editable, selected,
  onSelect, onChange, onImageSize }: {
  element: MugElement;
  area: MugPrintArea;
  /** Width of the print canvas in points. */
  width: number;
  editable: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, next: CaseTransform) => void;
  onImageSize: (id: string, size: Size) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const uri = elementImage(element);
  const height = width * (area.heightMm / area.widthMm);
  const [moving, setMoving] = useState<CaseTransform | null>(null);
  const current = moving ?? element;
  const box = elementBox(area, width, current.scale, element.imageSize);

  // The image's proportions decide its box; read once when they aren't known yet.
  useEffect(() => {
    if (!uri || element.imageSize) return;
    let active = true;
    Image.getSize(uri, (w, h) => { if (active && w > 0 && h > 0) onImageSize(element.id, { width: w, height: h }); },
      () => undefined);
    return () => { active = false; };
  }, [uri, element.id, element.imageSize, onImageSize]);

  const last = useSharedValue({ dx: 0, dy: 0, scale: 1, rotation: 0 });
  const latest = useSharedValue<CaseTransform | null>(null);
  const apply = (change: (from: CaseTransform) => Partial<CaseTransform>) => {
    const from = latest.get() ?? element;
    const next = clampElement({ ...from, ...change(from) });
    latest.set(next);
    setMoving(next);
  };
  const commit = () => {
    const next = latest.get();
    latest.set(null);
    setMoving(null);
    if (next) onChange(element.id, next);
  };
  const gesture = Gesture.Simultaneous(
    Gesture.Tap().runOnJS(true).enabled(editable).onEnd(() => onSelect(element.id)),
    Gesture.Pan().runOnJS(true).enabled(editable).minDistance(2)
      .onStart(() => { onSelect(element.id); last.set({ ...last.get(), dx: 0, dy: 0 }); })
      .onUpdate((event) => {
        const dx = event.translationX - last.get().dx;
        const dy = event.translationY - last.get().dy;
        last.set({ ...last.get(), dx: event.translationX, dy: event.translationY });
        apply((from) => ({ x: from.x + dx / width, y: from.y + dy / height }));
      })
      .onEnd(commit),
    Gesture.Pinch().runOnJS(true).enabled(editable && selected)
      .onStart(() => last.set({ ...last.get(), scale: 1 }))
      .onUpdate((event) => {
        const factor = event.scale / (last.get().scale || 1);
        last.set({ ...last.get(), scale: event.scale });
        apply((from) => ({ scale: from.scale * factor }));
      })
      .onEnd(commit),
    Gesture.Rotation().runOnJS(true).enabled(editable && selected)
      .onStart(() => last.set({ ...last.get(), rotation: 0 }))
      .onUpdate((event) => {
        const delta = event.rotation - last.get().rotation;
        last.set({ ...last.get(), rotation: event.rotation });
        apply((from) => ({ rotation: from.rotation + (delta * 180) / Math.PI }));
      })
      .onEnd(commit),
  );

  if (!uri) return null;
  return (
    <GestureDetector gesture={gesture}>
      <View accessible={editable} accessibilityRole="adjustable" accessibilityState={{ selected }}
        accessibilityLabel={t('mugs.studio.imageLabel')}
        style={[styles.box, {
          width: box.width, height: box.height,
          left: current.x * width - box.width / 2, top: current.y * height - box.height / 2,
          transform: [{ rotate: `${current.rotation}deg` }],
        }, selected && editable && { borderColor: theme.colors.accent, borderWidth: 1.5, borderStyle: 'dashed' }]}>
        <Image source={{ uri }} resizeMode="contain" style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors />
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  box: { position: 'absolute' },
});
