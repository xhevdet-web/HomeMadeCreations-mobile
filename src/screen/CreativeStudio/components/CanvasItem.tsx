import type { CanvasPlacement } from '@/api/builderModels';
import type { CatalogComponent } from '@/api/catalogModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { PlacedItem, type Transform } from '@/components/studio/PlacedItem';
import { clampForGroup, stackingOrder, type ComponentGroup } from '@/helper/canvasStudio';

/** Z layers shared by the canvases: drawn backdrop, items, drawn front, text, lifted item. */
export const Z = { back: 0, items: 10, front: 500, top: 600, lifted: 1000 };

/**
 * zIndex per placement, back to front. Items in front-layer groups (e.g. a bouquet wrap)
 * sit above the drawn front; the selected item is lifted while editing.
 */
export function zIndexes<T extends { id: string; subCategoryId: string }>(placements: T[],
  groupFor: (subCategoryId: string) => ComponentGroup, frontLayer: number, selectedId?: string | null) {
  const order = stackingOrder(placements, (id) => groupFor(id).layer);
  return Object.fromEntries(order.map((placement, index) => [placement.id,
    placement.id === selectedId ? Z.lifted
      : (groupFor(placement.subCategoryId).layer >= frontLayer ? Z.top : Z.items) + index]));
}

/** What every canvas needs to draw and edit its components. */
export interface CanvasItemsProps {
  size: number;
  placements: CanvasPlacement[];
  components: Record<string, CatalogComponent>;
  selectedId?: string | null;
  editable?: boolean;
  /** Highlights the valid placement zone (empty canvas or while dragging). */
  showZone?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, transform: Transform) => void;
  onRemove?: (id: string) => void;
}

/** One SubCategory on the canvas, using its real (transparent) image. */
export function CanvasItem({ placement, component, group, size, selected, editable, zIndex, onSelect,
  onChange, onRemove }: {
  placement: CanvasPlacement;
  component?: CatalogComponent;
  group: ComponentGroup;
  size: number;
  selected: boolean;
  editable: boolean;
  zIndex: number;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, transform: Transform) => void;
  onRemove?: (id: string) => void;
}) {
  const box = group.base * size;
  const name = component?.name ?? 'Item';
  return (
    <PlacedItem
      transform={placement}
      frame={{ left: 0, top: 0, width: size, height: size }}
      width={box}
      height={box}
      clamp={(next) => clampForGroup(next, group)}
      label={name}
      selected={selected}
      editable={editable}
      fixed={group.fixed}
      zIndex={zIndex}
      onSelect={() => onSelect?.(placement.id)}
      onChange={(transform) => onChange?.(placement.id, transform)}
      onRemove={() => onRemove?.(placement.id)}
    >
      <CatalogImage imageUrl={component?.imageUrl} name={name} size={box} />
    </PlacedItem>
  );
}
