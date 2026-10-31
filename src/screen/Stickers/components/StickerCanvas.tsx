import { useEffect, useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from 'react-native-svg';
import { Icon } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { clampTransform, coverSize, type CaseTransform, type Size } from '@/helper/caseStudio';
import { stickerOutline, type StickerSize } from '@/helper/stickers';

// Sticker paper: the artwork is printed on white, whatever the app theme.
const PAPER = '#FFFFFF';

/**
 * One sticker, drawn at its real proportions: white paper cut to the shape, and the
 * customer's artwork clipped to that cut edge. While editing, the artwork follows drag,
 * pinch and rotate, and a dashed line shows the safe area. Guides are never part of the
 * preview or its capture.
 */
export function StickerCanvas({ size, width, imageUri, fit = 'cover', imageSize, transform, editable = false,
  guides = false, onChange, onAdd, onImageSize, onImageError }: {
  size: StickerSize;
  width: number;
  imageUri?: string | null;
  /** cover: a photo fills the sticker at scale 1. contain: one of our PNG designs fits inside it. */
  fit?: 'cover' | 'contain';
  imageSize?: Size | null;
  transform: CaseTransform;
  editable?: boolean;
  guides?: boolean;
  onChange?: (next: CaseTransform) => void;
  /** Shown as the empty state's action while editing. */
  onAdd?: () => void;
  onImageSize?: (size: Size) => void;
  onImageError?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const outline = stickerOutline(size, width);
  const height = outline.height;
  const box = { width, height };
  // Until a photo's pixel size is known it simply fills the sticker, so it shows at once. A
  // contained design is drawn in the sticker's box and keeps its proportions inside it.
  const shown = fit === 'cover' && imageSize ? coverSize(box, imageSize) : box;
  const [failedUri, setFailedUri] = useState<string | null>(null);

  // The image's size isn't saved; it is read from the file when a set is reopened.
  useEffect(() => {
    if (!imageUri || imageSize || !onImageSize) return;
    let active = true;
    Image.getSize(imageUri, (w, h) => { if (active && w > 0 && h > 0) onImageSize({ width: w, height: h }); },
      () => undefined);
    return () => { active = false; };
  }, [imageUri, imageSize, onImageSize]);

  // A running gesture is drawn from local state and saved once it ends. Each gesture
  // applies only its change since its last update, so moving, pinching and rotating at the
  // same time never jump.
  const [moving, setMoving] = useState<CaseTransform | null>(null);
  const current = moving ?? transform;
  const last = useSharedValue({ dx: 0, dy: 0, scale: 1, rotation: 0 });
  const latest = useSharedValue<CaseTransform | null>(null);
  const apply = (change: (from: CaseTransform) => Partial<CaseTransform>) => {
    const from = latest.get() ?? transform;
    const next = clampTransform({ ...from, ...change(from) });
    latest.set(next);
    setMoving(next);
  };
  const commit = () => {
    const next = latest.get();
    latest.set(null);
    setMoving(null);
    if (next) onChange?.(next);
  };
  const live = editable && !!imageUri;
  const gesture = Gesture.Simultaneous(
    Gesture.Pan().runOnJS(true).enabled(live).minDistance(1)
      .onStart(() => last.set({ ...last.get(), dx: 0, dy: 0 }))
      .onUpdate((event) => {
        const dx = event.translationX - last.get().dx;
        const dy = event.translationY - last.get().dy;
        last.set({ ...last.get(), dx: event.translationX, dy: event.translationY });
        apply((from) => ({ x: from.x + dx / width, y: from.y + dy / height }));
      })
      .onEnd(commit),
    Gesture.Pinch().runOnJS(true).enabled(live)
      .onStart(() => last.set({ ...last.get(), scale: 1 }))
      .onUpdate((event) => {
        const factor = event.scale / (last.get().scale || 1);
        last.set({ ...last.get(), scale: event.scale });
        apply((from) => ({ scale: from.scale * factor }));
      })
      .onEnd(commit),
    Gesture.Rotation().runOnJS(true).enabled(live)
      .onStart(() => last.set({ ...last.get(), rotation: 0 }))
      .onUpdate((event) => {
        const delta = event.rotation - last.get().rotation;
        last.set({ ...last.get(), rotation: event.rotation });
        apply((from) => ({ rotation: from.rotation + (delta * 180) / Math.PI }));
      })
      .onEnd(commit),
  );

  const clipId = `sticker-cut-${useId().replace(/:/g, '')}`;
  const empty = !imageUri || failedUri === imageUri;

  return (
    <View style={{ width, height }}
      accessibilityLabel={empty ? t('stickers.studio.canvasEmpty') : t('stickers.studio.canvasLabel')}>
      <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={outline.edge} />
          </ClipPath>
        </Defs>
        <Path d={outline.edge} fill={PAPER} />
        {!empty && (
          <G clipPath={`url(#${clipId})`}>
            {/* Cover-sized at scale 1, centred on the saved position, then rotated and zoomed. */}
            <SvgImage href={{ uri: imageUri! }} x={-shown.width / 2} y={-shown.height / 2}
              width={shown.width} height={shown.height} preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
              transform={`translate(${current.x * width} ${current.y * height}) rotate(${current.rotation}) `
                + `scale(${current.scale})`} />
          </G>
        )}
        {guides && (
          <>
            {/* Cut edge, and the safe area with a soft light line under its dashes. */}
            <Path d={outline.edge} fill="none" stroke={theme.colors.border} strokeWidth={1.5} />
            <Path d={outline.safe} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2.5} />
            <Path d={outline.safe} fill="none" stroke={theme.colors.accent} strokeWidth={1.5}
              strokeDasharray="6 5" strokeOpacity={empty ? 0.95 : 0.8} />
          </>
        )}
      </Svg>
      {imageUri && (
        // Invisible copy that only reports an image the phone cannot open.
        <Image source={{ uri: imageUri }} style={styles.probe}
          onError={() => { setFailedUri(imageUri); onImageError?.(); }} />
      )}

      {live && (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill} accessible accessibilityRole="adjustable"
            accessibilityLabel={t('stickers.studio.gestureLabel')} />
        </GestureDetector>
      )}

      {guides && empty && onAdd && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('stickers.studio.upload')} onPress={onAdd}
          style={({ pressed }) => [StyleSheet.absoluteFill, styles.emptyState, { opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.plus, { borderColor: theme.colors.accent }]}>
            <Icon name="add" size={24} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyText} numberOfLines={2}>{t('stickers.studio.upload')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  probe: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  plus: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  // On white sticker paper in both themes, so a fixed dark text colour stays readable.
  emptyText: { color: '#2D3250', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
