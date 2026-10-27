import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ApparelPlacement, ApparelText, DesignSide } from '@/api/builderModels';
import type { Transform } from '@/components/studio/PlacedItem';
import { TextLayer } from '@/screen/CreativeStudio/components/TextLayer';
import { mockupFor, type ApparelLook } from '@/api/apparelModels';
import { printAreaFor, silhouetteOf } from '@/helper/apparel';
import { useTheme } from '@/hooks/useTheme';
import { GarmentImage } from './GarmentImage';
import { GarmentSilhouette } from './GarmentSilhouette';
import { PlacedDesign } from './PlacedDesign';

export interface DesignInfo { imageUrl?: string | null; name: string }

export function ApparelCanvas({ piece, side, color, size, placements, texts = [], designs, selectedId,
  exportMode = false, editable = true, onSelect, onChange, onRemove, onTextChange }: {
  /** The base product being designed on: its images, print areas and shape. */
  piece: ApparelLook | null | undefined;
  side: DesignSide;
  /** Product colour; tints the drawn garment when there is no image. */
  color: string;
  size: number;
  /** Designs on this side only. */
  placements: ApparelPlacement[];
  /** Text on this side only, drawn above the designs. */
  texts?: ApparelText[];
  designs: Record<string, DesignInfo>;
  selectedId?: string | null;
  exportMode?: boolean;
  editable?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<ApparelPlacement>) => void;
  onRemove?: (id: string) => void;
  onTextChange?: (id: string, transform: Transform) => void;
}) {
  const theme = useTheme();
  const area = printAreaFor(piece, side);
  const mockup = piece ? mockupFor(piece, side) : null;
  const editing = editable && !exportMode;
  const { t } = useTranslation();
  return (
    <View style={{ width: size, height: size }}
      accessibilityLabel={t(texts.length ? 'apparel.canvasLabelText' : 'apparel.canvasLabel', {
        side: t(side === 'FRONT' ? 'apparel.front' : 'apparel.back'),
        designs: t('counts.design', { count: placements.length }), count: texts.length })}>
      <Pressable accessible={false} style={StyleSheet.absoluteFill} disabled={!editing}
        onPress={() => onSelect?.(null)}>
        {mockup ? (
          <GarmentImage uri={mockup} size={size} />
        ) : (
          <GarmentSilhouette silhouette={silhouetteOf(piece)} side={side} color={color} size={size} />
        )}
      </Pressable>
      {editing && (
        <View pointerEvents="none" style={[styles.area, {
          left: area.x * size, top: area.y * size, width: area.width * size, height: area.height * size,
          borderColor: theme.colors.accent,
        }]}>
          {!placements.length && !texts.length && (
            <Text style={[styles.areaLabel, { color: theme.colors.accent }]}>{t('apparel.printArea')}</Text>
          )}
        </View>
      )}
      {placements.map((placement) => (
        <PlacedDesign
          key={placement.id}
          placement={placement}
          area={area}
          canvas={size}
          imageUrl={placement.imageUri ?? designs[placement.subCategoryId]?.imageUrl}
          name={designs[placement.subCategoryId]?.name ?? t('apparel.design')}
          selected={placement.id === selectedId}
          editable={editing}
          onSelect={() => onSelect?.(placement.id)}
          onChange={(patch) => onChange?.(placement.id, patch)}
          onRemove={() => onRemove?.(placement.id)}
        />
      ))}
      {texts.map((layer, index) => (
        <TextLayer key={layer.id} layer={layer} size={size} bounds={null}
          frame={{ left: area.x * size, top: area.y * size, width: area.width * size, height: area.height * size }}
          selected={layer.id === selectedId} editable={editing} zIndex={layer.id === selectedId ? 900 : 500 + index}
          onSelect={(id) => onSelect?.(id)} onChange={onTextChange} onRemove={onRemove} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    position: 'absolute', borderWidth: 1, borderStyle: 'dashed', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', opacity: 0.7,
  },
  areaLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
});
