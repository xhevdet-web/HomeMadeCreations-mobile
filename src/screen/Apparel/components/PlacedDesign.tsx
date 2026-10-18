import type { ApparelPlacement, PrintArea } from '@/api/builderModels';
import { clampPlacement, designSize } from '@/helper/apparel';
import { CatalogImage } from '@/components/products/CatalogImage';
import { PlacedItem, type Transform } from '@/components/studio/PlacedItem';

type Patch = Partial<Pick<ApparelPlacement, 'x' | 'y' | 'scale' | 'rotation'>>;

/** A design on a garment side; x/y are relative to the side's print area. */
export function PlacedDesign({ placement, area, canvas, imageUrl, name, selected, editable,
  onSelect, onChange, onRemove }: {
  placement: ApparelPlacement;
  area: PrintArea;
  canvas: number;
  imageUrl?: string | null;
  name: string;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onChange: (patch: Patch) => void;
  onRemove: () => void;
}) {
  const box = designSize(area, canvas, 1);
  return (
    <PlacedItem
      transform={placement}
      frame={{ left: area.x * canvas, top: area.y * canvas, width: area.width * canvas, height: area.height * canvas }}
      width={box}
      height={box}
      clamp={(next: Transform) => ({ ...next, ...clampPlacement(next, area) })}
      label={`${name} on the ${placement.side.toLowerCase()}`}
      name={name}
      selected={selected}
      editable={editable}
      onSelect={onSelect}
      onChange={onChange}
      onRemove={onRemove}
    >
      <CatalogImage imageUrl={imageUrl} name={name} size={box} />
    </PlacedItem>
  );
}
