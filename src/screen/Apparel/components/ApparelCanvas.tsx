import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ApparelPlacement, DesignSide } from '@/api/builderModels';
import { mockupFor, type Garment } from '@/api/garmentModels';
import { printAreaFor, silhouetteOf } from '@/helper/apparel';
import { useTheme } from '@/hooks/useTheme';
import { GarmentImage } from './GarmentImage';
import { GarmentSilhouette } from './GarmentSilhouette';
import { PlacedDesign } from './PlacedDesign';

export interface DesignInfo { imageUrl?: string | null; name: string }

/** What the canvas needs to draw a garment side: mockups, print areas and shape. */
export type GarmentLook = Pick<Garment,
  'silhouette' | 'frontPrintArea' | 'backPrintArea' | 'frontImageUrl' | 'backImageUrl'>;

export function ApparelCanvas({ garment, side, color, size, placements, designs, selectedId,
  exportMode = false, editable = true, onSelect, onChange, onRemove }: {
  garment: GarmentLook | null | undefined;
  side: DesignSide;
  /** Variant colour; tints the drawn garment when there is no mockup photo. */
  color: string;
  size: number;
  /** Designs on this side only. */
  placements: ApparelPlacement[];
  designs: Record<string, DesignInfo>;
  selectedId?: string | null;
  exportMode?: boolean;
  editable?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<ApparelPlacement>) => void;
  onRemove?: (id: string) => void;
}) {
  const theme = useTheme();
  const area = printAreaFor(garment, side);
  const mockup = garment ? mockupFor(garment, side) : null;
  const editing = editable && !exportMode;
  return (
    <View style={{ width: size, height: size }}
      accessibilityLabel={`${side === 'FRONT' ? 'Front' : 'Back'} with ${placements.length} designs`}>
      <Pressable accessible={false} style={StyleSheet.absoluteFill} disabled={!editing}
        onPress={() => onSelect?.(null)}>
        {mockup ? (
          <GarmentImage uri={mockup} size={size} />
        ) : (
          <GarmentSilhouette silhouette={silhouetteOf(garment)} side={side} color={color} size={size} />
        )}
      </Pressable>
      {editing && (
        <View pointerEvents="none" style={[styles.area, {
          left: area.x * size, top: area.y * size, width: area.width * size, height: area.height * size,
          borderColor: theme.colors.accent,
        }]}>
          {!placements.length && (
            <Text style={[styles.areaLabel, { color: theme.colors.accent }]}>PRINT AREA</Text>
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
          name={designs[placement.subCategoryId]?.name ?? 'Design'}
          selected={placement.id === selectedId}
          editable={editing}
          onSelect={() => onSelect?.(placement.id)}
          onChange={(patch) => onChange?.(placement.id, patch)}
          onRemove={() => onRemove?.(placement.id)}
        />
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
