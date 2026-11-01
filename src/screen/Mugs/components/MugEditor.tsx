import { memo, useEffect, useId } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, Ellipse, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { TextLayer as TextLayerModel } from '@/api/builderModels';
import { PlacedItem, type Frame, type Transform } from '@/components/studio/PlacedItem';
import { TextLayer } from '@/screen/CreativeStudio/components/TextLayer';
import { useTheme } from '@/hooks/useTheme';
import type { Size } from '@/helper/caseStudio';
import {
  elementBox, fitInside, PREVIEW_PRINT_SHARE_OF_HEIGHT, safeBounds, textBoxShare, type MugPrintArea,
} from '@/helper/mugs';
import { elementImage } from '@/services/mugDesign';
import type { MugElement } from '@/store/mugStore';

/** Which part of the print faces the customer: the start (handle on the left), middle or end. */
export type MugView = 'LEFT' | 'FRONT' | 'RIGHT';
export const MUG_VIEWS: MugView[] = ['LEFT', 'FRONT', 'RIGHT'];

// The real product is a white mug, drawn white in both app themes.
const WHITE = '#FFFFFF';
const EDGE = '#D9D9DE';
const INSIDE = '#ECECEF';
/** Body height ÷ diameter of a standard mug (visual only). */
const BODY_ASPECT = 1.15;
/** Stacking: images, text above them, shading over both, the edited item above it, guides on top. */
const Z = { items: 10, text: 2000, shade: 4000, lifted: 9000, guides: 9500 };

/**
 * Where everything sits on a mug drawn in a `width` × height stage. The body shows a window
 * of the print at its real proportions (no stretching): about half of a typical wrap. The
 * `frame` is the WHOLE print area in stage points, so element positions stay fractions of
 * the full print and the same design shows from any side.
 */
export function mugGeometry(area: MugPrintArea, width: number, view: MugView) {
  const bodyWidth = width * 0.6;
  const bodyHeight = bodyWidth * BODY_ASPECT;
  const rimY = bodyWidth * 0.08;
  const height = bodyHeight + rimY * 2 + 8;
  const cx = width / 2;
  const top = rimY + 4;
  const printHeight = bodyHeight * PREVIEW_PRINT_SHARE_OF_HEIGHT;
  const printTop = top + (bodyHeight - printHeight) / 2 + rimY * 0.4;
  const perMm = printHeight / area.heightMm;
  // Print visible on the body face, in mm, never more than the whole print.
  const visibleMm = Math.min(bodyWidth / perMm, area.widthMm);
  const windowWidth = visibleMm * perMm;
  const startMm = view === 'LEFT' ? 0 : view === 'RIGHT' ? area.widthMm - visibleMm : (area.widthMm - visibleMm) / 2;
  const windowLeft = cx - windowWidth / 2;
  const frame: Frame = { left: windowLeft - startMm * perMm, top: printTop, width: area.widthMm * perMm, height: printHeight };
  return {
    width, height, cx, top, rimY, bodyWidth, bodyHeight, perMm, frame,
    window: { left: windowLeft, top: printTop, width: windowWidth, height: printHeight },
    /** Whether the print is wider than the body face, so turning the mug shows more. */
    turns: visibleMm < area.widthMm,
    /** The x (0–1 of the print) facing the customer in this view, for new images. */
    centre: (startMm + visibleMm / 2) / area.widthMm,
    /** The view that shows an image best. */
    viewFor: (x: number): MugView => {
      const mm = x * area.widthMm;
      if (mm < visibleMm * 0.75) return 'LEFT';
      if (mm > area.widthMm - visibleMm * 0.75) return 'RIGHT';
      return 'FRONT';
    },
  };
}

const MugEditorItem = memo(function MugEditorItem({ element, area, frame, number, selected, zIndex, onSelect,
  onChange, onRemove, onImageSize }: {
  element: MugElement;
  area: MugPrintArea;
  frame: Frame;
  number: number;
  selected: boolean;
  zIndex: number;
  onSelect: (id: string) => void;
  onChange: (id: string, next: Transform) => void;
  onRemove: (id: string) => void;
  onImageSize: (id: string, size: Size) => void;
}) {
  const { t } = useTranslation();
  const uri = elementImage(element);
  // The image's proportions decide its box; read once when they aren't known yet.
  useEffect(() => {
    if (!uri || element.imageSize) return;
    let active = true;
    Image.getSize(uri, (w, h) => { if (active && w > 0 && h > 0) onImageSize(element.id, { width: w, height: h }); },
      () => undefined);
    return () => { active = false; };
  }, [uri, element.id, element.imageSize, onImageSize]);
  if (!uri) return null;
  // Box at scale 1 on the full print; PlacedItem scales and rotates it.
  const box = elementBox(area, frame.width, 1, element.imageSize);
  return (
    <PlacedItem transform={element} frame={frame} width={box.width} height={box.height}
      clamp={(next) => fitInside(next, area, element.imageSize)}
      label={t('mugs.studio.selected', { number })} selected={selected} editable zIndex={zIndex}
      onSelect={() => onSelect(element.id)} onChange={(next) => onChange(element.id, next)}
      onRemove={() => onRemove(element.id)}>
      <Image source={{ uri }} resizeMode="contain" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
    </PlacedItem>
  );
});

/**
 * The Mug Studio's editor: the white mug from one side, with the print area on its body.
 * Images and text are placed like pieces in the Gift studio: drag, pinch and rotate, or use
 * the corner handle; the edited item comes to the top so overlapping items stay reachable.
 * Everything stays inside the dashed safe area.
 */
export function MugEditor({ area, width, view, elements, texts, selectedId, onSelect, onChange, onTextChange,
  onRemove, onImageSize }: {
  area: MugPrintArea;
  width: number;
  view: MugView;
  /** In layer order, back to front. */
  elements: MugElement[];
  texts: TextLayerModel[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, next: Transform) => void;
  onTextChange: (id: string, next: Transform) => void;
  onRemove: (id: string) => void;
  onImageSize: (id: string, size: Size) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const id = useId().replace(/:/g, '');
  const g = mugGeometry(area, width, view);
  const left = g.cx - g.bodyWidth / 2;
  const right = g.cx + g.bodyWidth / 2;
  const bottom = g.top + g.bodyHeight;
  const radius = g.bodyWidth / 2;
  const body = `M${left},${g.top} L${left},${bottom} A${radius},${g.rimY} 0 0 0 ${right},${bottom} L${right},${g.top} `
    + `A${radius},${g.rimY} 0 0 1 ${left},${g.top} Z`;
  // The handle sits where the print starts (left view) or ends (right view); behind the mug from the front.
  const side = view === 'LEFT' ? -1 : view === 'RIGHT' ? 1 : 0;
  const edgeX = side < 0 ? left + 2 : right - 2;
  const reach = radius * 0.62;
  const handle = side === 0 ? null : `M${edgeX},${g.top + g.bodyHeight * 0.2} `
    + `C${edgeX + side * reach},${g.top + g.bodyHeight * 0.14} ${edgeX + side * reach * 1.05},${g.top + g.bodyHeight * 0.72} `
    + `${edgeX},${g.top + g.bodyHeight * 0.74}`;
  const safe = area.safeMm;
  const win = g.window;
  // The safe area in stage points; only the parts inside the visible window are drawn.
  const safeLeft = g.frame.left + safe.left * g.perMm;
  const safeRight = g.frame.left + g.frame.width - safe.right * g.perMm;
  const safeTop = win.top + safe.top * g.perMm;
  const safeBottom = win.top + win.height - safe.bottom * g.perMm;
  const fromX = Math.max(win.left, safeLeft);
  const toX = Math.min(win.left + win.width, safeRight);
  const inside = (x: number) => x >= win.left && x <= win.left + win.width;
  const dashed = { stroke: theme.colors.accent, strokeWidth: 1.5, strokeDasharray: '6 5' };

  return (
    <View style={[styles.stage, { width, height: g.height }]} accessibilityLabel={t('mugs.studio.canvasLabel')}>
      {/* The mug; tapping it (not an image) clears the selection. */}
      <Pressable accessible={false} style={[StyleSheet.absoluteFill, { zIndex: 0 }]} onPress={() => onSelect(null)}>
        <Svg pointerEvents="none" width={width} height={g.height}>
          {handle && (
            <>
              <Path d={handle} fill="none" stroke={EDGE} strokeWidth={radius * 0.2 + 3} strokeLinecap="round" />
              <Path d={handle} fill="none" stroke={WHITE} strokeWidth={radius * 0.2} strokeLinecap="round" />
            </>
          )}
          <Path d={body} fill={WHITE} stroke={EDGE} strokeWidth={1.2} />
          <Ellipse cx={g.cx} cy={g.top} rx={radius} ry={g.rimY} fill={WHITE} stroke={EDGE} strokeWidth={1.2} />
          <Ellipse cx={g.cx} cy={g.top + 1} rx={radius * 0.9} ry={g.rimY * 0.78} fill={INSIDE} />
        </Svg>
      </Pressable>

      {elements.map((element, index) => (
        <MugEditorItem key={element.id} element={element} area={area} frame={g.frame} number={index + 1}
          selected={element.id === selectedId}
          zIndex={element.id === selectedId ? Z.lifted : Z.items + index}
          onSelect={onSelect} onChange={onChange} onRemove={onRemove} onImageSize={onImageSize} />
      ))}

      {texts.map((layer, index) => (
        <TextLayer key={layer.id} layer={layer} size={width} bounds={safeBounds(area)} frame={g.frame}
          boxShare={textBoxShare(area)} selected={layer.id === selectedId} editable
          zIndex={layer.id === selectedId ? Z.lifted : Z.text + index}
          onSelect={onSelect} onChange={onTextChange} onRemove={onRemove} />
      ))}

      {/* Cylinder shading over the images and text, so they read as printed on the mug. */}
      <Svg pointerEvents="none" width={width} height={g.height} style={[StyleSheet.absoluteFill, { zIndex: Z.shade }]}>
        <Defs>
          <LinearGradient id={`shade-${id}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.14} />
            <Stop offset="0.2" stopColor="#000000" stopOpacity={0.02} />
            <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.25} />
            <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.16} />
          </LinearGradient>
        </Defs>
        <Path d={body} fill={`url(#shade-${id})`} />
      </Svg>

      {/* Guides: the print area's ends (where visible) and the dashed safe area. */}
      <Svg pointerEvents="none" width={width} height={g.height} style={[StyleSheet.absoluteFill, { zIndex: Z.guides }]}>
        <Rect x={win.left} y={win.top} width={win.width} height={win.height} fill="none" stroke={EDGE}
          strokeWidth={1} />
        {toX > fromX && (
          <>
            <Line x1={fromX} y1={safeTop} x2={toX} y2={safeTop} {...dashed} />
            <Line x1={fromX} y1={safeBottom} x2={toX} y2={safeBottom} {...dashed} />
          </>
        )}
        {inside(safeLeft) && <Line x1={safeLeft} y1={safeTop} x2={safeLeft} y2={safeBottom} {...dashed} />}
        {inside(safeRight) && <Line x1={safeRight} y1={safeTop} x2={safeRight} y2={safeBottom} {...dashed} />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Images may hang over the mug while being moved; nothing is drawn outside the stage.
  stage: { overflow: 'hidden' },
});
