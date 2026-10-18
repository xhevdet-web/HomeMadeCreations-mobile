import { useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { groupOf } from '@/helper/canvasStudio';
import { useTheme } from '@/hooks/useTheme';
import { CanvasItem, Z, zIndexes, type CanvasItemsProps } from '../components/CanvasItem';

// Paper and stem tones belong to the product, so they stay the same in dark mode.
const PAPER = { back: '#F3DFD8', backShade: '#E6C3B8', front: '#EDCBC1', frontShade: '#D9A99C', fold: '#C9958A' };
const STEM = '#5E7F4E';
const RIBBON = { fill: '#FFFFFF', edge: '#E3C3BA' };
const STEMS = [-7, -4, -1.5, 1.5, 4, 7];

/** Wrap paper rising behind the flowers, and the stems that gather at the binding. */
function BackWrap({ size, paper }: { size: number; paper: boolean }) {
  // Gradient ids must be unique per screen (web keeps earlier screens mounted).
  const id = `bouquet-back-${useId().replace(/:/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PAPER.back} />
          <Stop offset="1" stopColor={PAPER.backShade} />
        </LinearGradient>
      </Defs>
      {paper && (
        <Path d="M12 46 C14 22 32 10 50 10 C68 10 86 22 88 46 L58 86 L42 86 Z" fill={`url(#${id})`} />
      )}
      {STEMS.map((offset) => (
        <Line key={offset} x1={50 + offset * 1.6} y1={58} x2={50 + offset * 0.35} y2={97}
          stroke={STEM} strokeWidth={1.3} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

/** Front cone of paper and the ribbon bow; drawn over the stems, under nothing editable. */
function FrontWrap({ size }: { size: number }) {
  const id = `bouquet-front-${useId().replace(/:/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={PAPER.frontShade} />
          <Stop offset="0.45" stopColor={PAPER.front} />
          <Stop offset="1" stopColor={PAPER.frontShade} />
        </LinearGradient>
      </Defs>
      <Path d="M20 58 Q50 66 80 58 L59 92 L41 92 Z" fill={`url(#${id})`} />
      <Path d="M36 62 L46 91 M64 62 L54 91" stroke={PAPER.fold} strokeWidth={0.5} opacity={0.6} fill="none" />
      <Ellipse cx={44.5} cy={75} rx={5.5} ry={3.2} fill={RIBBON.fill} stroke={RIBBON.edge} strokeWidth={0.5}
        transform="rotate(-18 44.5 75)" />
      <Ellipse cx={55.5} cy={75} rx={5.5} ry={3.2} fill={RIBBON.fill} stroke={RIBBON.edge} strokeWidth={0.5}
        transform="rotate(18 55.5 75)" />
      <Path d="M49 76 L45 85 L47.5 84 M51 76 L55 85 L52.5 84" stroke={RIBBON.edge} strokeWidth={1.2}
        fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={75.5} rx={2} ry={1.8} fill={RIBBON.fill} stroke={RIBBON.edge} strokeWidth={0.5} />
    </Svg>
  );
}

/** Dashed outline of where flowers can go: a dome narrowing to the binding. */
function Zone({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d="M14 40 C14 18 32 10 50 10 C68 10 86 18 86 40 C86 52 70 60 62 66 L38 66 C30 60 14 52 14 40 Z"
        fill={color} fillOpacity={0.06} stroke={color} strokeWidth={0.5} strokeDasharray="2 1.5" />
    </Svg>
  );
}

/**
 * A hand-tied bouquet: greenery at the back, then flowers, then fillers, with the wrap
 * paper in front of the stems. Positions are fractions of the canvas, so the same
 * design restores on any screen.
 */
export function BouquetCanvas({ size, placements, components, selectedId, editable = true, showZone,
  onSelect, onChange, onRemove }: CanvasItemsProps) {
  const theme = useTheme();
  const groupFor = (subCategoryId: string) => groupOf('BOUQUET', components[subCategoryId]?.type);
  // A wrapping SubCategory replaces the drawn paper with its real image.
  const customWrap = placements.some((placement) => groupFor(placement.subCategoryId).key === 'WRAPPING');
  const z = zIndexes(placements, groupFor, groupOf('BOUQUET', 'WRAPPING').layer, editable ? selectedId : null);
  return (
    <View style={{ width: size, height: size }}
      accessibilityLabel={`Bouquet with ${placements.length} ${placements.length === 1 ? 'item' : 'items'}`}>
      <Pressable accessible={false} style={[StyleSheet.absoluteFill, { zIndex: Z.back }]} disabled={!editable}
        onPress={() => onSelect?.(null)}>
        <BackWrap size={size} paper={!customWrap} />
      </Pressable>
      {editable && showZone && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: Z.back + 1 }]}>
          <Zone size={size} color={theme.colors.accent} />
        </View>
      )}
      {/* The front wrap covers the stems and the lower flowers, like real paper. */}
      {!customWrap && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: Z.front }]}>
          <FrontWrap size={size} />
        </View>
      )}
      {placements.map((placement) => (
        <CanvasItem key={placement.id} placement={placement} component={components[placement.subCategoryId]}
          group={groupFor(placement.subCategoryId)} size={size} selected={placement.id === selectedId}
          editable={editable} zIndex={z[placement.id]} onSelect={onSelect} onChange={onChange}
          onRemove={onRemove} />
      ))}
    </View>
  );
}
