import { useId } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { DesignItem as DesignItemModel, JewelryType } from '@/types/models';
import { itemById } from '@/services/catalog';
import { itemPosition } from '@/helper/design';
import { BeadShape } from './DesignItem';
import { useTheme } from '@/hooks/useTheme';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useCatalogStore } from '@/store/catalogStore';

export interface CanvasProps {
  items: DesignItemModel[];
  type?: JewelryType;
  size?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  decorative?: boolean;
}
export function JewelryCanvas({
  items,
  type = 'bracelet',
  size = 320,
  selectedId,
  onSelect,
  decorative = false,
}: CanvasProps) {
  const uid = useId().replace(/:/g, '');
  const theme = useTheme();
  const catalogItems = useCatalogStore((state) => state.items);
  const ry = type === 'necklace' ? 119 : 96;
  const radius = Math.min(15.5, 285 / Math.max(items.length, 16));
  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessibilityLabel={`${type} with ${items.length} components`}
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 320">
        <Defs>
          <RadialGradient id={`glow-${uid}`}>
            <Stop offset="0" stopColor="#A78550" stopOpacity={0.12} />
            <Stop offset="1" stopColor="#A78550" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={160} cy={160} r={157} fill={`url(#glow-${uid})`} />
        <Ellipse
          cx={160}
          cy={148}
          rx={111}
          ry={ry}
          stroke={theme.colors.gold}
          strokeWidth={1.7}
          opacity={0.8}
          fill="none"
        />
        {!items.length && Array.from({ length: 48 }, (_, index) => {
          const point = itemPosition(index, 48, type);
          return <Circle key={`link-${index}`} cx={point.x} cy={point.y} r={1.4}
            fill={theme.colors.gold} opacity={0.85} />;
        })}
        {items.map((entry, index) => {
          const item = itemById[entry.itemId];
          if (!item || item.categoryId || item.imageUrl) return null;
          const point = itemPosition(index, items.length, type, entry.angle);
          return (
            <BeadShape
              key={entry.id}
              item={item}
              x={point.x}
              y={point.y}
              radius={item.type === 'spacer' ? radius * 0.65 : radius}
              id={`${uid}-${index}`}
              selected={entry.id === selectedId}
              onPress={onSelect ? () => onSelect(entry.id) : undefined}
            />
          );
        })}
        {decorative && (
          <G>
            <Circle
              cx={160}
              cy={148 + ry + 11}
              r={5}
              stroke="#DDBF84"
              strokeWidth={2}
              fill="none"
            />
            <BeadShape
              item={itemById.heart}
              x={160}
              y={148 + ry + 27}
              radius={13}
              id={`${uid}-charm`}
            />
          </G>
        )}
        {type === 'necklace' && (
          <Path d="M151 28 Q160 16 169 28" fill="none" stroke="#CBA66E" strokeWidth={2} />
        )}
      </Svg>
      {items.map((entry, index) => {
        const item = catalogItems[entry.itemId] ?? itemById[entry.itemId];
        if (!item || !(item.categoryId || item.imageUrl)) return null;
        const point = itemPosition(index, items.length, type, entry.angle);
        const diameter = radius * 2 * size / 320;
        return (
          <Pressable key={entry.id} testID={`placed-${entry.id}`}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityLabel={`Select canvas position ${index + 1}, ${item.name}`}
            onPress={onSelect ? () => onSelect(entry.id) : undefined}
            disabled={!onSelect}
            style={{ position: 'absolute', left: point.x * size / 320 - diameter / 2,
              top: point.y * size / 320 - diameter / 2, width: diameter, height: diameter }}>
            {entry.id === selectedId && <View pointerEvents="none" style={{
              position: 'absolute', inset: -4, borderRadius: diameter, borderWidth: 2,
              borderColor: theme.colors.accent,
            }} />}
            <CatalogImage imageUrl={item.imageUrl} name={item.name} size={diameter} />
          </Pressable>
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
