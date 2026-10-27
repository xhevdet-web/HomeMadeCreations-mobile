import { useId } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { boundsFor, GIFT_BAG, type CanvasBuilder } from '@/helper/canvasStudio';
import { Bow, KRAFT, luminance, shade } from './packaging/PackagingArt';

// Fine line-art, like a florist's or packaging sketch: it shows what is being made and
// where things sit on it, without looking like a cartoon or dictating the design.
const INK = '#9C8A79';
const PAPER = '#E8DCCB';
const BAG = '#F4E9E4';

/** A hand-tied bouquet: paper wrap behind and in front, folds, a ribbon bow and stems. */
/** `labels`: the editing-aid caption, or null when capturing the preview. */
function Bouquet({ labels }: { labels: string | null }) {
  return (
    <G stroke={INK} strokeWidth={0.45} strokeLinecap="round" strokeLinejoin="round">
      {/* Back paper rising behind the flowers. */}
      <Path d="M16 50 C18 27 33 14 50 14 C67 14 82 27 84 50 L61 85 L39 85 Z" fill={PAPER} fillOpacity={0.35} />
      <Path d="M30 30 C38 24 44 22 50 22 M70 30 C62 24 56 22 50 22" fill="none" strokeOpacity={0.4} />
      {/* Stems gathered below the binding. */}
      {[-3.5, -1.2, 1.2, 3.5].map((offset) => (
        <Path key={offset} d={`M${50 + offset * 1.4} 86 L${50 + offset * 0.5} 98`} fill="none" stroke="#7E9A6E" />
      ))}
      {/* Front paper cone with its folds. */}
      <Path d="M23 61 Q50 70 77 61 L58.5 92 L41.5 92 Z" fill={PAPER} fillOpacity={0.6} />
      <Path d="M36 64.5 L45 91.5 M64 64.5 L55 91.5 M50 67 L50 92" fill="none" strokeOpacity={0.45} />
      {/* Ribbon bow at the binding. */}
      <Ellipse cx={45} cy={77} rx={5} ry={2.8} fill="#FFFFFF" fillOpacity={0.8} transform="rotate(-18 45 77)" />
      <Ellipse cx={55} cy={77} rx={5} ry={2.8} fill="#FFFFFF" fillOpacity={0.8} transform="rotate(18 55 77)" />
      <Path d="M48.8 78 L45.5 86 M51.2 78 L54.5 86" fill="none" />
      <Ellipse cx={50} cy={77.4} rx={1.8} ry={1.6} fill="#FFFFFF" />
      {labels && (
        <SvgText x={50} y={40} fill={INK} stroke="none" fontSize={2.6} fontWeight="600" letterSpacing={0.6}
          textAnchor="middle" opacity={0.55}>
          {labels}
        </SvgText>
      )}
    </G>
  );
}

/** GIFT: closed packaging chosen, drawn as a gift box in its colour (null hex: plain kraft) and shape. */
export interface SceneWrap { hex: string | null; shape: 'SQUARE' | 'RECTANGULAR' }

/** A gift bag seen from the front: body, top fold, side gussets and handles. */
function GiftBag({ labels }: { labels: string | null }) {
  // Drawn from the same shape that keeps the pieces on the bag.
  const left = GIFT_BAG.left * 100;
  const top = GIFT_BAG.top * 100;
  const right = GIFT_BAG.right * 100;
  const bottom = GIFT_BAG.bottom * 100;
  const fold = 6;
  return (
    <G stroke={INK} strokeWidth={0.45} strokeLinecap="round" strokeLinejoin="round">
      <Path d={`M36 ${top} C36 ${top - 22} 64 ${top - 22} 64 ${top}`} fill="none" strokeWidth={1.1} />
      <Path d={`M39.5 ${top} C39.5 ${top - 16} 60.5 ${top - 16} 60.5 ${top}`} fill="none" strokeOpacity={0.5} />
      <Rect x={left} y={top} width={right - left} height={bottom - top} rx={1.6} fill={BAG} fillOpacity={0.6} />
      {/* Top fold and the side gussets give the bag its depth. */}
      <Path d={`M${left} ${top} L${left + fold} ${top + fold} L${right - fold} ${top + fold} L${right} ${top}`}
        fill="none" strokeOpacity={0.6} />
      <Path d={`M${left + fold} ${top + fold} L${left + fold} ${bottom} M${right - fold} ${top + fold} L${right - fold} ${bottom}`}
        fill="none" strokeOpacity={0.35} strokeDasharray="1.6 1.2" />
      {labels && (
        <SvgText x={50} y={bottom - 3} fill={INK} stroke="none" fontSize={2.6} fontWeight="600" letterSpacing={0.6}
          textAnchor="middle" opacity={0.55}>
          {labels}
        </SvgText>
      )}
    </G>
  );
}

type BoxShape = SceneWrap['shape'];

/**
 * The open gift box while designing, in canvas units (0–100). Pieces may use exactly the
 * box's bounds, the same ones placement uses; the front wall starts a little below the
 * back rim, like a box seen from above.
 */
function boxOf(shape: BoxShape) {
  const bounds = boundsFor('GIFT', false, shape) ?? GIFT_BAG;
  const top = bounds.top * 100;
  return {
    left: bounds.left * 100,
    top,
    right: bounds.right * 100,
    bottom: bounds.bottom * 100,
    /** Top edge of the front wall. */
    front: top + (shape === 'RECTANGULAR' ? 8 : 10),
    /** Depth of the inner side walls. */
    inset: 5,
  };
}
const boxRibbon = (hex: string) => shade(hex, luminance(hex) < 0.05 ? 0.12 : -0.14);

/**
 * Closed packaging while designing, behind the pieces: the lid with its ribbon and bow set
 * down behind the box, and the inside of the box (back wall, side walls) in shadow.
 */
function GiftBox({ hex, shape }: { hex: string; shape: BoxShape }) {
  const uid = useId().replace(/:/g, '');
  const { left, top, right, bottom, inset } = boxOf(shape);
  const ribbon = boxRibbon(hex);
  return (
    <G stroke={shade(hex, -0.35)} strokeWidth={0.4} strokeLinejoin="round">
      <Defs>
        {/* Deeper shadow towards the bottom of the box. */}
        <LinearGradient id={`inside-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(hex, -0.3)} />
          <Stop offset="1" stopColor={shade(hex, -0.6)} />
        </LinearGradient>
      </Defs>
      {/* The lid, set down behind the box, still tied with its ribbon and bow. */}
      <G transform={`rotate(-4 50 ${top - 10})`}>
        <Rect x={left - 2} y={top - 15} width={right - left + 4} height={10} rx={1.2} fill={shade(hex, 0.08)} />
        <Rect x={left - 2} y={top - 8} width={right - left + 4} height={3} fill={shade(hex, -0.12)} stroke="none" />
        <Rect x={47} y={top - 15} width={6} height={10} fill={ribbon} stroke="none" />
        <Bow x={50} y={top - 15} scale={0.9} color={ribbon} />
      </G>
      {/* Inside: back wall, then the inner side walls catching less light. */}
      <Rect x={left} y={top} width={right - left} height={bottom - top} fill={`url(#inside-${uid})`} />
      <Polygon points={`${left},${top} ${left + inset},${top + 3} ${left + inset},${bottom - 3} ${left},${bottom}`}
        fill={shade(hex, -0.22)} />
      <Polygon points={`${right},${top} ${right - inset},${top + 3} ${right - inset},${bottom - 3} ${right},${bottom}`}
        fill={shade(hex, -0.5)} />
      {/* The back wall's top edge. */}
      <Rect x={left} y={top} width={right - left} height={1.6} fill={shade(hex, 0.06)} />
    </G>
  );
}

/**
 * The box's front wall, drawn above the pieces as a tinted, see-through panel with a solid
 * rim, edges and ribbon. Pieces read as sitting inside the box, and the customer still
 * sees everything they put in. Never touchable: pieces underneath stay movable.
 */
export function GiftBoxFront({ hex, shape, size }: { hex: string; shape: BoxShape; size: number }) {
  const uid = useId().replace(/:/g, '');
  const { left, right, bottom, front } = boxOf(shape);
  const width = right - left;
  const ribbon = boxRibbon(hex);
  const edge = shade(hex, -0.35);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
          <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.04} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G stroke={edge} strokeWidth={0.4} strokeLinejoin="round">
        {/* The see-through wall: the box colour, light enough to show what is inside. */}
        {/* Dark colours veil more, so they get a lighter tint. */}
        <Rect x={left} y={front} width={width} height={bottom - front} fill={hex}
          fillOpacity={luminance(hex) < 0.05 ? 0.24 : 0.34} />
        <Rect x={left} y={front} width={width} height={bottom - front} fill={`url(#sheen-${uid})`} stroke="none" />
        {/* Solid edges give the wall its shape. */}
        <Rect x={left} y={front} width={1.8} height={bottom - front} fill={shade(hex, 0.04)} stroke="none" />
        <Rect x={right - 1.8} y={front} width={1.8} height={bottom - front} fill={shade(hex, -0.22)} stroke="none" />
        <Rect x={left} y={bottom - 2.4} width={width} height={2.4} fill={shade(hex, -0.12)} stroke="none" />
        <Rect x={47} y={front} width={6} height={bottom - front} fill={ribbon} fillOpacity={0.62} stroke="none" />
        <Path d={`M50 ${front} L50 ${bottom}`} stroke={shade(ribbon, 0.3)} strokeWidth={0.5} strokeOpacity={0.6} />
        {/* Top rim of the front wall, in front of everything. */}
        <Rect x={left - 0.6} y={front - 1.2} width={width + 1.2} height={3} rx={0.6} fill={shade(hex, 0.08)} />
        <Rect x={left} y={front} width={width} height={bottom - front} fill="none" />
      </G>
    </Svg>
  );
}

/**
 * The object being designed, drawn behind the customer's pieces when its base product has
 * no photo. It is saved in the preview, so the order shows where every piece and text sits
 * on the bouquet or bag. Labels are editing aids and are never saved.
 */
export function StudioScene({ builder, size, labels, wrap }: {
  builder: CanvasBuilder;
  size: number;
  labels: boolean;
  /** GIFT: closed packaging chosen; the bag becomes its gift box. */
  wrap?: SceneWrap | null;
}) {
  const { t } = useTranslation();
  const label = labels ? t(builder === 'BOUQUET' ? 'studioMessages.flowersGreenery' : 'studioMessages.frontOfBag') : null;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      {builder === 'BOUQUET' ? <Bouquet labels={label} />
        : wrap ? <GiftBox hex={wrap.hex ?? KRAFT} shape={wrap.shape} /> : <GiftBag labels={label} />}
    </Svg>
  );
}
