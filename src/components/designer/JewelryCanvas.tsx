import { useEffect, useId } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { DesignItem as DesignItemModel, JewelryType } from '@/types/models';
import { itemById } from '@/services/catalog';
import { cordPath, ringLayout, scalePoint, shapeCentre, slotBasePoint, slotPosition } from '@/helper/design';
import { BeadShape } from './DesignItem';
import { useTheme } from '@/hooks/useTheme';
import { CatalogImage } from '@/components/products/CatalogImage';
import { lengthLayout, TYPICAL_PIECE_MM } from '@/helper/jewelry';
import { useCatalogStore } from '@/store/catalogStore';

const ZOOM_MS = 220;
// Without a chosen length, pieces with a physical size are drawn relative to the strand's
// average piece, within limits that keep them from crowding their neighbours.
const MIN_RELATIVE = 0.75;
const MAX_RELATIVE = 1.3;
// A true-scale piece may be drawn tiny (a 4 mm spacer), but is always this easy to tap.
const MIN_TOUCH_PX = 44;
// Image beads render in a fixed box and scale down, so the image never re-lays out.
const BOX_RADIUS = 20;

export interface CanvasProps {
  items: DesignItemModel[];
  type?: JewelryType;
  size?: number;
  /** Maximum beads for the chosen size; drives the auto-zoom. */
  capacity?: number | null;
  /**
   * Jewelry sized by length: the chosen length in mm. The cord then stands for exactly
   * that length and every piece is drawn at its real size along it.
   */
  lengthMm?: number | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  decorative?: boolean;
  exportMode?: boolean;
}

function PlacedBead({ entry, index, base, type, size, scale, beadRadius, relative, hitSlop, selected,
  onSelect, imageUrl, name, accent }: {
  entry: DesignItemModel;
  index: number;
  /** Full-size position on the cord; the zoom scales it about the shape centre. */
  base: { x: number; y: number };
  type: JewelryType;
  size: number;
  scale: SharedValue<number>;
  beadRadius: SharedValue<number>;
  /** Drawn size relative to the average piece (1 = average). */
  relative: number;
  /** Extra touch area around a small piece, in its own (unscaled) units. */
  hitSlop: number;
  selected: boolean;
  onSelect?: (id: string) => void;
  imageUrl?: string | null;
  name: string;
  accent: string;
}) {
  const { cx, cy } = shapeCentre(type);
  const unit = size / 320;
  const box = BOX_RADIUS * 2 * unit;
  const { x: baseX, y: baseY } = base;
  const style = useAnimatedStyle(() => {
    const x = (cx + (baseX - cx) * scale.value) * unit;
    const y = (cy + (baseY - cy) * scale.value) * unit;
    return {
      transform: [
        { translateX: x - box / 2 },
        { translateY: y - box / 2 },
        { scale: (beadRadius.value / BOX_RADIUS) * relative },
      ],
    };
  });
  const { t } = useTranslation();
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: box, height: box }, style]}>
      <Pressable testID={`placed-${entry.id}`}
        accessibilityRole={onSelect ? 'button' : undefined}
        accessibilityLabel={t('jewelry.canvasPosition', { position: index + 1, name })}
        onPress={onSelect ? () => onSelect(entry.id) : undefined}
        disabled={!onSelect}
        hitSlop={hitSlop}
        style={{ width: box, height: box }}>
        {selected && <View pointerEvents="none" style={{
          position: 'absolute', inset: -5, borderRadius: box, borderWidth: 3,
          borderColor: accent,
        }} />}
        <CatalogImage imageUrl={imageUrl} name={name} size={box} />
      </Pressable>
    </Animated.View>
  );
}

export function JewelryCanvas({
  items,
  type = 'bracelet',
  size = 320,
  capacity,
  lengthMm,
  selectedId,
  onSelect,
  decorative = false,
  exportMode = false,
}: CanvasProps) {
  const uid = useId().replace(/:/g, '');
  const theme = useTheme();
  const catalogItems = useCatalogStore((state) => state.items);
  const centre = shapeCentre(type);
  const trueScale = !!lengthMm;
  const layout = trueScale ? lengthLayout(items, type, lengthMm!) : ringLayout(items.length, type, capacity);
  const lengths = items.map((entry) => (catalogItems[entry.itemId] ?? itemById[entry.itemId])?.lengthMm ?? null);
  const measured = lengths.filter((length): length is number => !!length);
  const average = measured.length ? measured.reduce((sum, length) => sum + length, 0) / measured.length : 0;
  // True scale: each piece at its own size against a typical bead. Otherwise a gentle hint
  // of size around the strand's average piece.
  const relativeAt = (index: number) => trueScale
    ? (lengths[index] ?? TYPICAL_PIECE_MM) / TYPICAL_PIECE_MM
    : lengths[index] && average ? Math.min(MAX_RELATIVE, Math.max(MIN_RELATIVE, lengths[index]! / average)) : 1;
  const unit = size / 320;
  const hitSlopAt = (index: number) => {
    const shown = (layout.beadRadius / BOX_RADIUS) * relativeAt(index);
    return Math.max(0, (MIN_TOUCH_PX / shown - BOX_RADIUS * 2 * unit) / 2);
  };
  const scale = useSharedValue(layout.scale);
  const beadRadius = useSharedValue(layout.beadRadius);
  useEffect(() => {
    // The preview export must capture the final layout, never a frame mid-zoom.
    scale.value = exportMode ? layout.scale : withTiming(layout.scale, { duration: ZOOM_MS });
    beadRadius.value = exportMode
      ? layout.beadRadius
      : withTiming(layout.beadRadius, { duration: ZOOM_MS });
  }, [layout.scale, layout.beadRadius, exportMode, scale, beadRadius]);
  const cordColor = exportMode ? '#C7773F' : theme.colors.gold;
  const { t } = useTranslation();
  const necklace = type === 'necklace';
  const cord = cordPath(type, layout.scale);
  // The clasp sits at the top of the piece, where the curve starts.
  const clasp = scalePoint(type, { x: centre.cx, y: necklace ? 16 : 48 }, layout.scale);
  const bottom = scalePoint(type, { x: centre.cx, y: necklace ? 284 : 272 }, layout.scale);

  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessibilityLabel={t('jewelry.canvasLabel', { piece: t(`jewelry.pieceTypes.${type}`), count: items.length })}
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 320" style={{ position: 'absolute' }}
        pointerEvents="box-none">
        <Defs>
          <RadialGradient id={`glow-${uid}`}>
            <Stop offset="0" stopColor="#A78550" stopOpacity={0.14} />
            <Stop offset="1" stopColor="#A78550" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {!exportMode && <Circle cx={centre.cx} cy={centre.cy} r={150} fill={`url(#glow-${uid})`} />}
        {necklace ? (
          <>
            {/* A fine link chain: a thin core plus round-capped dashes that read as links. */}
            <Path d={cord} stroke={cordColor} strokeWidth={0.8} opacity={0.55} fill="none" />
            <Path d={cord} stroke={cordColor} strokeWidth={2.2} strokeDasharray="2.4 2.2"
              strokeLinecap="round" opacity={0.85} fill="none" />
            <Circle cx={clasp.x - 5} cy={clasp.y} r={3.2} stroke={cordColor} strokeWidth={1.4}
              fill="none" />
            <Path
              d={`M${clasp.x - 1.5} ${clasp.y - 3} Q${clasp.x + 6} ${clasp.y - 4} ${clasp.x + 6} ${clasp.y + 1} Q${clasp.x + 5} ${clasp.y + 4} ${clasp.x - 1.5} ${clasp.y + 3}`}
              stroke={cordColor} strokeWidth={1.6} fill="none" />
          </>
        ) : (
          <Path d={cord} stroke={cordColor} strokeWidth={1.7} opacity={0.8} fill="none" />
        )}
        {items.map((entry, index) => {
          const item = itemById[entry.itemId];
          if (!item || item.categoryId || item.imageUrl) return null;
          const point = slotPosition(index, type, layout);
          return (
            <BeadShape
              key={entry.id}
              item={item}
              x={point.x}
              y={point.y}
              radius={item.type === 'spacer' ? layout.beadRadius * 0.65 : layout.beadRadius}
              id={`${uid}-${index}`}
              selected={!exportMode && entry.id === selectedId}
              onPress={!exportMode && onSelect ? () => onSelect(entry.id) : undefined}
            />
          );
        })}
        {decorative && (
          <G>
            <Circle cx={bottom.x} cy={bottom.y + 11} r={5} stroke="#DDBF84"
              strokeWidth={2} fill="none" />
            <BeadShape item={itemById.heart} x={bottom.x} y={bottom.y + 27} radius={13}
              id={`${uid}-charm`} />
          </G>
        )}
      </Svg>
      {!items.length && !exportMode && onSelect && (
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center',
          justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.muted, fontSize: 12, textAlign: 'center' }}>
            {t('jewelry.firstBead')}
          </Text>
        </View>
      )}
      {items.map((entry, index) => {
        const item = catalogItems[entry.itemId] ?? itemById[entry.itemId];
        if (!item || !(item.categoryId || item.imageUrl)) return null;
        return (
          <PlacedBead
            key={entry.id}
            entry={entry}
            index={index}
            base={slotBasePoint(index, type, layout)}
            type={type}
            size={size}
            scale={scale}
            beadRadius={beadRadius}
            relative={relativeAt(index)}
            hitSlop={hitSlopAt(index)}
            selected={!exportMode && entry.id === selectedId}
            onSelect={onSelect}
            imageUrl={item.imageUrl}
            name={item.name}
            accent={theme.colors.accent}
          />
        );
      })}
    </View>
  );
}
export const BraceletCanvas = (props: Omit<CanvasProps, 'type'>) => (
  <JewelryCanvas {...props} type="bracelet" />
);
export const NecklaceCanvas = (props: Omit<CanvasProps, 'type'>) => (
  <JewelryCanvas {...props} type="necklace" />
);
