import { useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { TextLayer as TextLayerModel } from '@/api/builderModels';
import type { Transform } from '@/components/studio/PlacedItem';
import { groupOf } from '@/helper/canvasStudio';
import { useTheme } from '@/hooks/useTheme';
import { CanvasItem, Z, zIndexes, type CanvasItemsProps } from '../components/CanvasItem';
import { TextLayer } from './TextLayer';

// The drawn bag is clear film: a faint back panel, the handles, and a glossy front.
const FILM = { panel: '#FFFFFF', edge: '#CFC6BD', handle: '#FFFFFF', handleEdge: '#D7CFC6' };

function BagBack({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Path d="M36 31 C36 9 64 9 64 31" fill="none" stroke={FILM.handleEdge} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M36 31 C36 9 64 9 64 31" fill="none" stroke={FILM.handle} strokeWidth={2.4} strokeLinecap="round" />
      <Rect x={20} y={30} width={60} height={62} rx={2.5} fill={FILM.panel} fillOpacity={0.4}
        stroke={FILM.edge} strokeWidth={0.5} />
    </Svg>
  );
}

function BagFront({ size }: { size: number }) {
  // Gradient ids must be unique per screen (web keeps earlier screens mounted).
  const id = `gift-film-${useId().replace(/:/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.06} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
      <Rect x={20} y={30} width={60} height={62} rx={2.5} fill={`url(#${id})`} stroke={FILM.edge} strokeWidth={0.7} />
      <Rect x={20} y={30} width={60} height={3.2} fill="#FFFFFF" fillOpacity={0.55} />
      <Path d="M27 36 L32 36 L24 86 L22 86 Z" fill="#FFFFFF" fillOpacity={0.35} />
      <Path d="M76 40 L78 40 L78 70 Z" fill="#FFFFFF" fillOpacity={0.3} />
    </Svg>
  );
}

/** Dashed outline of where items go: inside the bag. */
function Zone({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Rect x={24} y={36} width={52} height={52} rx={3} fill={color} fillOpacity={0.06} stroke={color}
        strokeWidth={0.5} strokeDasharray="2 1.5" />
    </Svg>
  );
}

/**
 * A gift container with items arranged inside, decorations around it and personalised
 * text on the front. With an admin "Bag & box" SubCategory, its real image is the
 * container; otherwise a clear gift bag is drawn.
 */
export function GiftCanvas({ size, placements, components, texts, selectedId, editable = true, showZone,
  onSelect, onChange, onRemove, onTextChange }: CanvasItemsProps & {
  texts: TextLayerModel[];
  onTextChange?: (id: string, transform: Transform) => void;
}) {
  const theme = useTheme();
  const groupFor = (subCategoryId: string) => groupOf('GIFT', components[subCategoryId]?.type);
  const container = placements.some((placement) => groupFor(placement.subCategoryId).key === 'CONTAINER');
  // Decorations hang over the bag's film; everything else sits inside it.
  const z = zIndexes(placements, groupFor, groupOf('GIFT', 'DECORATION').layer, editable ? selectedId : null);
  const fill = (zIndex: number) => [StyleSheet.absoluteFill, { zIndex }];
  return (
    <View style={{ width: size, height: size }}
      accessibilityLabel={`Gift with ${placements.length} ${placements.length === 1 ? 'item' : 'items'}`
        + (texts.length ? ` and ${texts.length} text` : '')}>
      <Pressable accessible={false} style={fill(Z.back)} disabled={!editable} onPress={() => onSelect?.(null)}>
        {!container && <BagBack size={size} />}
      </Pressable>
      {editable && showZone && (
        <View pointerEvents="none" style={fill(Z.back + 1)}>
          <Zone size={size} color={theme.colors.accent} />
        </View>
      )}
      {!container && (
        <View pointerEvents="none" style={fill(Z.front)}>
          <BagFront size={size} />
        </View>
      )}
      {placements.map((placement) => (
        <CanvasItem key={placement.id} placement={placement} component={components[placement.subCategoryId]}
          group={groupFor(placement.subCategoryId)} size={size} selected={placement.id === selectedId}
          editable={editable} zIndex={z[placement.id]} onSelect={onSelect} onChange={onChange}
          onRemove={onRemove} />
      ))}
      {texts.map((layer, index) => (
        <TextLayer key={layer.id} layer={layer} size={size} selected={layer.id === selectedId}
          editable={editable} zIndex={editable && layer.id === selectedId ? Z.lifted : Z.top + 200 + index}
          onSelect={(id) => onSelect?.(id)} onChange={onTextChange} onRemove={onRemove} />
      ))}
    </View>
  );
}
