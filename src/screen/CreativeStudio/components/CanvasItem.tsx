import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CanvasPlacement } from '@/api/builderModels';
import type { CatalogComponent } from '@/api/catalogModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { PlacedItem, type Transform } from '@/components/studio/PlacedItem';
import { clampInside, pieceBox, type Bounds, type ComponentGroup } from '@/helper/canvasStudio';

/**
 * One placed piece, using its real (transparent) photo. The customer can drag it anywhere
 * inside `bounds` (the gift bag) or the canvas, resize and rotate it. A soft shadow
 * follows the photo's outline (iOS and web) so it rests in the scene.
 */
export function CanvasItem({ placement, component, group, size, bounds, selected, editable, zIndex, onSelect,
  onChange, onRemove }: {
  placement: CanvasPlacement;
  component?: CatalogComponent;
  group: ComponentGroup;
  size: number;
  /** Where the whole piece must stay; null for the canvas. */
  bounds: Bounds | null;
  selected: boolean;
  editable: boolean;
  zIndex: number;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, transform: Transform) => void;
  onRemove?: (id: string) => void;
}) {
  const box = group.base * size;
  const { t } = useTranslation();
  const name = component?.name ?? t('studio.item');
  return (
    <PlacedItem
      transform={placement}
      frame={{ left: 0, top: 0, width: size, height: size }}
      width={box}
      height={box}
      clamp={(next) => clampInside(next, pieceBox(group), bounds)}
      label={name}
      selected={selected}
      editable={editable}
      zIndex={zIndex}
      onSelect={() => onSelect?.(placement.id)}
      onChange={(transform) => onChange?.(placement.id, transform)}
      onRemove={() => onRemove?.(placement.id)}
    >
      <View style={{
        shadowColor: '#3B2A1E', shadowOpacity: 0.28, shadowRadius: Math.max(2, box * 0.04),
        shadowOffset: { width: 0, height: Math.max(1, box * 0.025) },
      }}>
        <CatalogImage imageUrl={component?.imageUrl} name={name} size={box} />
      </View>
    </PlacedItem>
  );
}
