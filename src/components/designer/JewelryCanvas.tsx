import { useEffect, useId } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { DesignItem as DesignItemModel, JewelryType } from '@/types/models';
import { itemById } from '@/services/catalog';
import { ringGeometry, ringLayout, slotPosition } from '@/helper/design';
import { BeadShape } from './DesignItem';
import { useTheme } from '@/hooks/useTheme';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useCatalogStore } from '@/store/catalogStore';

const ZOOM_MS = 320;
// Image beads render in a fixed box and scale down, so the image never re-lays out.
const BOX_RADIUS = 20;

export interface CanvasProps {
  items: DesignItemModel[];
  type?: JewelryType;
  size?: number;
  /** Maximum beads for the chosen size; drives the auto-zoom. */
  capacity?: number | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  decorative?: boolean;
  exportMode?: boolean;
}

function PlacedBead({ entry, index, fraction, type, size, scale, beadRadius, selected,
  onSelect, imageUrl, name, accent }: {
  entry: DesignItemModel;
  index: number;
  /** Position around the ring, 0–1 from the top. */
  fraction: number;
  type: JewelryType;
  size: number;
  scale: SharedValue<number>;
  beadRadius: SharedValue<number>;
  selected: boolean;
  onSelect?: (id: string) => void;
  imageUrl?: string | null;
  name: string;
  accent: string;
}) {
  const { cx, cy, rx, ry } = ringGeometry(type);
  const angle = fraction * Math.PI * 2 - Math.PI / 2;
  const unit = size / 320;
  const box = BOX_RADIUS * 2 * unit;
  const style = useAnimatedStyle(() => {
    const x = (cx + rx * scale.value * Math.cos(angle)) * unit;
    const y = (cy + ry * scale.value * Math.sin(angle)) * unit;
    return {
      transform: [
        { translateX: x - box / 2 },
        { translateY: y - box / 2 },
        { scale: beadRadius.value / BOX_RADIUS },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: box, height: box }, style]}>
      <Pressable testID={`placed-${entry.id}`}
        accessibilityRole={onSelect ? 'button' : undefined}
        accessibilityLabel={`Select canvas position ${index + 1}, ${name}`}
        onPress={onSelect ? () => onSelect(entry.id) : undefined}
        disabled={!onSelect}
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
  selectedId,
  onSelect,
  decorative = false,
  exportMode = false,
}: CanvasProps) {
  const uid = useId().replace(/:/g, '');
  const theme = useTheme();
  const catalogItems = useCatalogStore((state) => state.items);
  const geometry = ringGeometry(type);
  const layout = ringLayout(items.length, type, capacity);
  const scale = useSharedValue(layout.scale);
  const beadRadius = useSharedValue(layout.beadRadius);
  useEffect(() => {
    // The preview export must capture the final layout, never a frame mid-zoom.
    scale.value = exportMode ? layout.scale : withTiming(layout.scale, { duration: ZOOM_MS });
    beadRadius.value = exportMode
      ? layout.beadRadius
      : withTiming(layout.beadRadius, { duration: ZOOM_MS });
  }, [layout.scale, layout.beadRadius, exportMode, scale, beadRadius]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cordColor = exportMode ? '#C7773F' : theme.colors.gold;
  const ringBottom = geometry.cy + geometry.ry * layout.scale;

  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessibilityLabel={`${type} with ${items.length} components`}
    >
      {!exportMode && (
        <Svg width="100%" height="100%" viewBox="0 0 320 320" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id={`glow-${uid}`}>
              <Stop offset="0" stopColor="#A78550" stopOpacity={0.14} />
              <Stop offset="1" stopColor="#A78550" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={geometry.cx} cy={geometry.cy} r={150} fill={`url(#glow-${uid})`} />
        </Svg>
      )}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: 'absolute', width: size, height: size,
          transformOrigin: `${(geometry.cx / 320) * 100}% ${(geometry.cy / 320) * 100}%`,
        }, ringStyle]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 320 320">
          <Ellipse
            cx={geometry.cx}
            cy={geometry.cy}
            rx={geometry.rx}
            ry={geometry.ry}
            stroke={cordColor}
            strokeWidth={1.7}
            vectorEffect="non-scaling-stroke"
            opacity={0.8}
            fill="none"
          />
          {type === 'necklace' && (
            <Path
              d={`M${geometry.cx - 9} ${geometry.cy - geometry.ry} Q${geometry.cx} ${geometry.cy - geometry.ry - 12} ${geometry.cx + 9} ${geometry.cy - geometry.ry}`}
              fill="none" stroke="#CBA66E" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          )}
        </Svg>
      </Animated.View>
      <Svg width="100%" height="100%" viewBox="0 0 320 320" style={{ position: 'absolute' }}
        pointerEvents="box-none">
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
            <Circle cx={geometry.cx} cy={ringBottom + 11} r={5} stroke="#DDBF84"
              strokeWidth={2} fill="none" />
            <BeadShape item={itemById.heart} x={geometry.cx} y={ringBottom + 27} radius={13}
              id={`${uid}-charm`} />
          </G>
        )}
      </Svg>
      {!items.length && !exportMode && onSelect && (
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center',
          justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.muted, fontSize: 12, textAlign: 'center' }}>
            Add your first bead
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
            fraction={layout.offset + index / layout.slots}
            type={type}
            size={size}
            scale={scale}
            beadRadius={beadRadius}
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
