import { useEffect, useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from 'react-native-svg';
import { Icon } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import type { CaseArea, CaseTemplate } from '@/api/caseModels';
import { clampTransform, coverSize, type CaseTransform, type Size } from '@/helper/caseStudio';

// Phones are roughly twice as tall as wide; used until the template has loaded.
export const DEFAULT_CASE_ASPECT = 2.05;

/** Height ÷ width of a remote image (the model's template), once it is known. */
export function useImageAspect(uri: string | null | undefined, fallback = DEFAULT_CASE_ASPECT) {
  const [aspect, setAspect] = useState<{ uri: string; value: number } | null>(null);
  useEffect(() => {
    if (!uri) return;
    let active = true;
    Image.getSize(uri, (width, height) => {
      if (active && width > 0 && height > 0) setAspect({ uri, value: height / width });
    }, () => undefined);
    return () => { active = false; };
  }, [uri]);
  return aspect && aspect.uri === uri ? aspect.value : fallback;
}

/** SVG path of a rectangle with rounded corners (radius capped to fit). */
function roundedRect(frame: { left: number; top: number; width: number; height: number }, radius: number) {
  const r = Math.max(0, Math.min(radius, frame.width / 2, frame.height / 2));
  const { left: x, top: y, width: w, height: h } = frame;
  return `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} `
    + `A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} `
    + `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
}

const pixels = (area: CaseArea, width: number, height: number) => ({
  left: area.x * width, top: area.y * height, width: area.width * width, height: area.height * height,
});

/**
 * The phone case, bottom to top: the model's template, the customer's image clipped to the
 * printable area minus the camera opening, and the model's optional overlay. The image never
 * shows outside the case or inside the camera, so every phone keeps its real camera. While
 * editing, dashed lines show the printable area and camera exactly as set in the admin.
 */
export function CaseCanvas({ template, width, aspect, imageUri, imageSize, transform, editable, guides,
  onChange, onAdd, onImageSize, onImageError }: {
  template: CaseTemplate;
  width: number;
  /** Template height ÷ width. */
  aspect: number;
  imageUri?: string | null;
  imageSize?: Size | null;
  transform: CaseTransform;
  /** Drag, pinch and rotate the image. */
  editable: boolean;
  /** The dashed safe area and empty state; hidden in the preview and its capture. */
  guides: boolean;
  onChange: (next: CaseTransform) => void;
  onAdd?: () => void;
  onImageSize?: (size: Size) => void;
  /** The photo or design could not be loaded. */
  onImageError?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const height = width * aspect;
  const box = pixels(template.area, width, height);
  const corner = (template.area.radius ?? 0) * box.width;
  const cover = imageSize ? coverSize(box, imageSize) : null;
  // Until the photo's pixel size is known it simply fills the area, so it shows at once.
  const shown = cover ?? { width: box.width, height: box.height };
  const [failedUri, setFailedUri] = useState<string | null>(null);

  // The image's size isn't saved; it is read from the file when a design is reopened.
  useEffect(() => {
    if (!imageUri || imageSize || !onImageSize) return;
    let active = true;
    Image.getSize(imageUri, (w, h) => { if (active && w > 0 && h > 0) onImageSize({ width: w, height: h }); },
      () => undefined);
    return () => { active = false; };
  }, [imageUri, imageSize, onImageSize]);

  // While a gesture runs, its transform is kept here and drawn directly; it is saved when
  // the gesture ends. Plain layout (no animated styles) draws the same on iOS, Android and web.
  const [moving, setMoving] = useState<CaseTransform | null>(null);
  const current = moving ?? transform;
  // Each gesture applies only its change since its last update, so moving, pinching and
  // rotating at the same time never jump.
  const last = useSharedValue({ dx: 0, dy: 0, scale: 1, rotation: 0 });
  // The latest gesture value, read when the gesture ends (state may not have rendered yet).
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
    if (next) onChange(next);
  };
  const live = editable && !!imageUri;
  const gesture = Gesture.Simultaneous(
    Gesture.Pan().runOnJS(true).enabled(live).minDistance(1)
      .onStart(() => last.set({ ...last.get(), dx: 0, dy: 0 }))
      .onUpdate((event) => {
        const dx = event.translationX - last.get().dx;
        const dy = event.translationY - last.get().dy;
        last.set({ ...last.get(), dx: event.translationX, dy: event.translationY });
        apply((from) => ({ x: from.x + dx / box.width, y: from.y + dy / box.height }));
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

  const camera = template.camera ? pixels(template.camera, width, height) : null;
  const cameraCorner = (template.camera?.radius ?? 0) * (camera?.width ?? 0);
  const empty = !imageUri;
  const clipId = `case-print-${useId().replace(/:/g, '')}`;
  // Printable area minus the camera opening: the image is never drawn inside the camera,
  // so the template's real camera (and any see-through lens holes) stays as it is.
  const printable = roundedRect(box, corner) + (camera ? ' ' + roundedRect(camera, cameraCorner) : '');
  const centreX = box.left + current.x * box.width;
  const centreY = box.top + current.y * box.height;

  return (
    <View style={{ width, height }}
      accessibilityLabel={empty ? t('cases.studio.canvasEmpty') : t('cases.studio.canvasLabel')}>
      {template.imageUrl ? (
        <Image source={{ uri: template.imageUrl }} resizeMode="contain" style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors />
      ) : (
        // Without a template the case outline is drawn, so the studio still works.
        <View style={[StyleSheet.absoluteFill, styles.fallbackCase, { borderRadius: corner + 4 }]} />
      )}

      {imageUri && failedUri !== imageUri && (
        <>
          <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <ClipPath id={clipId}>
                <Path d={printable} clipRule="evenodd" fillRule="evenodd" />
              </ClipPath>
            </Defs>
            <G clipPath={`url(#${clipId})`}>
              {/* Cover-sized at scale 1, centred on the saved position, then rotated and zoomed. */}
              <SvgImage href={{ uri: imageUri }} x={-shown.width / 2} y={-shown.height / 2}
                width={shown.width} height={shown.height} preserveAspectRatio="xMidYMid slice"
                transform={`translate(${centreX} ${centreY}) rotate(${current.rotation}) scale(${current.scale})`} />
            </G>
          </Svg>
          {/* Invisible copy that only reports a photo the phone cannot open. */}
          <Image source={{ uri: imageUri }} style={styles.probe}
            onError={() => { setFailedUri(imageUri); onImageError?.(); }} />
        </>
      )}

      {template.overlayImageUrl && (
        <Image pointerEvents="none" source={{ uri: template.overlayImageUrl }} resizeMode="contain"
          style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
      )}

      {/* The same lines as the admin's template editor: printable area and camera opening. */}
      {guides && (
        <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
          {[roundedRect(box, corner), ...(camera ? [roundedRect(camera, cameraCorner)] : [])].map((d) => (
            <G key={d}>
              {/* A soft light line under the dashes keeps them visible on any case colour. */}
              <Path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={2.5} />
              <Path d={d} fill="none" stroke={theme.colors.accent} strokeWidth={1.5} strokeDasharray="7 6"
                strokeOpacity={empty ? 0.95 : 0.7} />
            </G>
          ))}
        </Svg>
      )}

      {editable && !empty && (
        <GestureDetector gesture={gesture}>
          <View style={[styles.touch, box]} accessible accessibilityRole="adjustable"
            accessibilityLabel={t('cases.studio.gestureLabel')} />
        </GestureDetector>
      )}

      {guides && empty && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('cases.studio.addDesign')} onPress={onAdd}
          disabled={!onAdd}
          style={({ pressed }) => [styles.emptyState, box, { opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.plus, { backgroundColor: theme.colors.badge, borderColor: theme.colors.accent }]}>
            <Icon name="add" size={26} color={theme.colors.accent} />
          </View>
          <View style={[styles.emptyLabel, { backgroundColor: theme.colors.badge }]}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('cases.studio.designGoesHere')}</Text>
            <Text style={[styles.emptyHint, { color: theme.colors.muted }]}>{t('cases.studio.addDesign')}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackCase: { backgroundColor: '#E9E4DC', borderWidth: 1, borderColor: '#D3CBBE' },
  probe: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  touch: { position: 'absolute' },
  emptyState: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  plus: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  emptyLabel: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 2 },
  emptyTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  emptyHint: { fontSize: 12, textAlign: 'center' },
});
