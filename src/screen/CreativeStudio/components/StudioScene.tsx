import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { GIFT_BAG, type CanvasBuilder } from '@/helper/canvasStudio';

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

/**
 * The object being designed, drawn behind the customer's pieces when its base product has
 * no photo. It is saved in the preview, so the order shows where every piece and text sits
 * on the bouquet or bag. Labels are editing aids and are never saved.
 */
export function StudioScene({ builder, size, labels }: { builder: CanvasBuilder; size: number; labels: boolean }) {
  const { t } = useTranslation();
  const label = labels ? t(builder === 'BOUQUET' ? 'studioMessages.flowersGreenery' : 'studioMessages.frontOfBag') : null;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      {builder === 'BOUQUET' ? <Bouquet labels={label} /> : <GiftBag labels={label} />}
    </Svg>
  );
}
