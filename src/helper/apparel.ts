import type { ApparelPlacement, DesignSide, PrintArea } from '@/api/builderModels';
import type { ApparelLook } from '@/api/apparelModels';

export type Silhouette = 'HOODIE' | 'TSHIRT';

type PieceShape = Pick<ApparelLook, 'silhouette' | 'printAreas'>;

// Default printable areas (fractions of the square garment canvas) per silhouette and
// side, used until a product has its own print areas configured in the dashboard.
const DEFAULT_PRINT_AREAS: Record<Silhouette, Record<DesignSide, PrintArea>> = {
  HOODIE: {
    FRONT: { x: 0.33, y: 0.34, width: 0.34, height: 0.26 },
    BACK: { x: 0.29, y: 0.35, width: 0.42, height: 0.4 },
  },
  TSHIRT: {
    FRONT: { x: 0.31, y: 0.25, width: 0.38, height: 0.44 },
    BACK: { x: 0.29, y: 0.21, width: 0.42, height: 0.5 },
  },
};

/** A design at scale 1 is this share of the print-area width. */
const BASE_DESIGN_SHARE = 0.5;
export const MIN_DESIGN_SCALE = 0.3;

export function silhouetteOf(piece?: Pick<ApparelLook, 'silhouette'> | null): Silhouette {
  return piece?.silhouette === 'HOODIE' ? 'HOODIE' : 'TSHIRT';
}

export function printAreaFor(piece: PieceShape | null | undefined, side: DesignSide): PrintArea {
  const configured = side === 'FRONT' ? piece?.printAreas?.front : piece?.printAreas?.back;
  return configured ?? DEFAULT_PRINT_AREAS[silhouetteOf(piece)][side];
}

/** Edge length of a design box in canvas pixels. */
export function designSize(area: PrintArea, canvas: number, scale: number) {
  return area.width * canvas * BASE_DESIGN_SHARE * scale;
}

/** Largest scale whose box still fits the print area. */
export function maxDesignScale(area: PrintArea) {
  return Math.min(area.width, area.height) / (area.width * BASE_DESIGN_SHARE);
}

/**
 * Keeps a design's rotated bounding box inside the print area. Positions are the design
 * centre, normalised 0–1 within the area; returns the nearest valid position.
 */
export function clampPlacement(placement: Pick<ApparelPlacement, 'x' | 'y' | 'scale' | 'rotation'>,
  area: PrintArea) {
  const radians = (placement.rotation * Math.PI) / 180;
  // A rotated box needs more room, so the size cap shrinks with the rotation.
  const spread = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));
  const scale = Math.min(Math.max(placement.scale, MIN_DESIGN_SCALE), maxDesignScale(area) / spread);
  // Half extents of the rotated box, as fractions of the area's width and height.
  const box = area.width * BASE_DESIGN_SHARE * scale;
  const half = (box / 2) * spread;
  const halfX = Math.min(half / area.width, 0.5);
  const halfY = Math.min(half / area.height, 0.5);
  return {
    scale,
    x: Math.min(Math.max(placement.x, halfX), 1 - halfX),
    y: Math.min(Math.max(placement.y, halfY), 1 - halfY),
  };
}

export function apparelTotal(basePrice: number, placements: ApparelPlacement[],
  priceOf: (subCategoryId: string) => number) {
  return placements.reduce((sum, placement) => sum + priceOf(placement.subCategoryId), basePrice);
}
