import type { CanvasPlacement, TextLayer } from '@/api/builderModels';

/** Builders composed freely on one canvas. */
export type CanvasBuilder = 'BOUQUET' | 'GIFT';
export const CANVAS_BUILDERS: readonly CanvasBuilder[] = ['BOUQUET', 'GIFT'];

export function isCanvasBuilder(value: unknown): value is CanvasBuilder {
  return CANVAS_BUILDERS.includes(value as CanvasBuilder);
}

export type Transform = Pick<CanvasPlacement, 'x' | 'y' | 'scale' | 'rotation'>;

/**
 * Where a component may sit. `halfWidth(y)` is the allowed distance of the item centre
 * from the canvas centre line at height y, so zones can be shaped (a bouquet is wide at
 * the top and narrows toward the stems). All values are fractions of the canvas.
 */
interface Zone {
  top: number;
  bottom: number;
  halfWidth: (y: number) => number;
  centerX?: number;
}

/**
 * A family of SubCategories that share a picker tab, a layer and a placement zone.
 * Matching is by keyword on SubCategory.type, so "FLOWER", "Flowers" or "flower-head"
 * all work; unknown types fall into the builder's main group.
 */
export interface ComponentGroup {
  key: string;
  label: string;
  match: RegExp;
  /** Stacking layer, back (0) to front. */
  layer: number;
  zone: Zone;
  /** Edge of the item box at scale 1, as a share of the canvas. */
  base: number;
  minScale: number;
  maxScale: number;
  /** Only one at a time (a wrap, a bag): adding another replaces it. */
  single?: boolean;
  /** Fixed in place (the gift container): not draggable. */
  fixed?: boolean;
}

const rect = (left: number, right: number, top: number, bottom: number): Zone => ({
  top, bottom, centerX: (left + right) / 2, halfWidth: () => (right - left) / 2,
});

/**
 * Flower heads: an elliptical dome on top that narrows linearly toward the binding
 * point, like a hand-tied bouquet seen from the front.
 */
const dome = (cx: number, cy: number, rx: number, ry: number, bottom: number, waist: number): Zone => ({
  top: cy - ry,
  bottom,
  centerX: cx,
  halfWidth: (y) => y <= cy
    ? Math.max(rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)), 0.05)
    : rx + (waist - rx) * Math.min((y - cy) / (bottom - cy), 1),
});

export const BOUQUET_CENTER = { x: 0.5, y: 0.38 };
/** Where the stems meet and the wrap is tied. */
export const BOUQUET_BINDING = { x: 0.5, y: 0.7 };

const BOUQUET_GROUPS: ComponentGroup[] = [
  { key: 'GREENERY', label: 'Greenery', match: /GREEN|LEAF|LEAV|FOLIAGE|FERN|EUCALYPT/, layer: 0,
    zone: dome(0.5, 0.38, 0.4, 0.3, 0.62, 0.16), base: 0.3, minScale: 0.5, maxScale: 1.8 },
  { key: 'FLOWERS', label: 'Flowers', match: /FLOWER|BLOOM|ROSE|STEM/, layer: 1,
    zone: dome(0.5, 0.38, 0.34, 0.25, 0.62, 0.12), base: 0.26, minScale: 0.5, maxScale: 1.8 },
  { key: 'FILLERS', label: 'Fillers', match: /FILL|BREATH|GYPSOPHILA/, layer: 2,
    zone: dome(0.5, 0.38, 0.38, 0.28, 0.62, 0.14), base: 0.2, minScale: 0.5, maxScale: 1.8 },
  { key: 'WRAPPING', label: 'Wrapping', match: /WRAP|PAPER|SLEEVE|CONE/, layer: 3,
    zone: rect(0.42, 0.58, 0.64, 0.76), base: 0.62, minScale: 0.8, maxScale: 1.3, single: true },
];

const GIFT_GROUPS: ComponentGroup[] = [
  { key: 'CONTAINER', label: 'Bag & box', match: /BAG|BOX|BASKET|CONTAINER|PACKAG|HAMPER/, layer: 0,
    zone: rect(0.5, 0.5, 0.54, 0.54), base: 0.9, minScale: 1, maxScale: 1, single: true, fixed: true },
  { key: 'FILLER', label: 'Filler', match: /FILL|SHRED|STRAW|NEST/, layer: 1,
    zone: rect(0.3, 0.7, 0.72, 0.84), base: 0.42, minScale: 0.6, maxScale: 1.6 },
  { key: 'ITEMS', label: 'Items', match: /ITEM|PRODUCT|MUG|CUP|FOOD|SWEET|CHOC|COOKIE|DRINK|COFFEE|TEA|CANDLE|TOY|BEAR/,
    layer: 2, zone: rect(0.32, 0.68, 0.46, 0.78), base: 0.3, minScale: 0.5, maxScale: 1.8 },
  { key: 'DECORATIONS', label: 'Decorations', match: /DECOR|RIBBON|BOW|CARD|HEART|TAG|FLOWER|STICKER|BALLOON/,
    layer: 3, zone: rect(0.14, 0.86, 0.12, 0.9), base: 0.2, minScale: 0.5, maxScale: 2 },
];

/** Text sits on the bag's front panel. */
export const GIFT_TEXT_ZONE = rect(0.3, 0.7, 0.36, 0.86);
/** Text box at scale 1, as shares of the canvas. */
export const TEXT_BOX = { width: 0.56, height: 0.13 };

const GROUPS: Record<CanvasBuilder, ComponentGroup[]> = { BOUQUET: BOUQUET_GROUPS, GIFT: GIFT_GROUPS };
const MAIN_GROUP: Record<CanvasBuilder, string> = { BOUQUET: 'FLOWERS', GIFT: 'ITEMS' };

// Picker tab order (layers are drawing order, not how customers browse).
const TAB_ORDER: Record<CanvasBuilder, string[]> = {
  BOUQUET: ['FLOWERS', 'GREENERY', 'FILLERS', 'WRAPPING'],
  GIFT: ['ITEMS', 'DECORATIONS', 'FILLER', 'CONTAINER'],
};

/** Groups in picker tab order. */
export function groupsFor(builder: CanvasBuilder) {
  return TAB_ORDER[builder].map((key) => GROUPS[builder].find((group) => group.key === key)!);
}

/** The group of a SubCategory, from its admin-set type. */
export function groupOf(builder: CanvasBuilder, type: string | null | undefined): ComponentGroup {
  const groups = GROUPS[builder];
  const normalized = (type ?? '').toUpperCase();
  return (normalized && groups.find((group) => group.match.test(normalized)))
    || groups.find((group) => group.key === MAIN_GROUP[builder])!;
}

/** Whether a type is recognised (unrecognised items are shown under "All" only). */
export function hasKnownGroup(builder: CanvasBuilder, type: string | null | undefined) {
  const normalized = (type ?? '').toUpperCase();
  return !!normalized && GROUPS[builder].some((group) => group.match.test(normalized));
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Nearest valid transform inside a zone; drops outside snap back to its edge. */
export function clampToZone(transform: Transform, zone: Zone, minScale: number, maxScale: number): Transform {
  const y = clamp(transform.y, zone.top, zone.bottom);
  const cx = zone.centerX ?? 0.5;
  const half = zone.halfWidth(y);
  return {
    x: clamp(transform.x, cx - half, cx + half),
    y,
    scale: clamp(transform.scale, minScale, maxScale),
    rotation: clamp(transform.rotation, -360, 360),
  };
}

export function clampForGroup(transform: Transform, group: ComponentGroup) {
  return clampToZone(transform, group.zone, group.minScale, group.maxScale);
}

export function clampText(transform: Transform) {
  return clampToZone(transform, GIFT_TEXT_ZONE, 0.4, 2.5);
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const GIFT_SLOTS = [
  [0.5, 0.6], [0.38, 0.66], [0.62, 0.66], [0.5, 0.74], [0.4, 0.52], [0.6, 0.52], [0.36, 0.76], [0.64, 0.76],
];

/**
 * Where the n-th item of a group lands when tapped (not dragged). Flowers fan out on a
 * sunflower spiral so a tapped bouquet already looks arranged; greenery frames the
 * edge; gift items fill the bag front to back.
 */
export function defaultPosition(builder: CanvasBuilder, group: ComponentGroup, index: number): Transform {
  let x = 0.5;
  let y = 0.5;
  if (builder === 'BOUQUET' && group.key !== 'WRAPPING') {
    const angle = index * GOLDEN_ANGLE + (group.key === 'GREENERY' ? 0.6 : 0);
    const ring = group.key === 'GREENERY' ? 0.92 : Math.min(Math.sqrt((index + 0.4) / 9), 1) * 0.86;
    x = BOUQUET_CENTER.x + Math.cos(angle) * ring * 0.34;
    y = BOUQUET_CENTER.y + Math.sin(angle) * ring * 0.24;
  } else if (builder === 'BOUQUET') {
    x = BOUQUET_BINDING.x;
    y = BOUQUET_BINDING.y;
  } else if (group.key === 'ITEMS') {
    [x, y] = GIFT_SLOTS[index % GIFT_SLOTS.length];
  } else if (group.key === 'FILLER') {
    x = 0.5 + ((index % 3) - 1) * 0.14;
    y = 0.8;
  } else if (group.key === 'DECORATIONS') {
    const corners = [[0.72, 0.36], [0.28, 0.4], [0.7, 0.8], [0.3, 0.82]];
    [x, y] = corners[index % corners.length];
  } else {
    y = group.zone.top;
  }
  return clampForGroup({ x, y, scale: 1, rotation: 0 }, group);
}

/** Back-to-front drawing order; the selected item is lifted to the front while editing. */
export function stackingOrder<T extends { id: string; subCategoryId: string }>(
  placements: T[], layerOf: (subCategoryId: string) => number, selectedId?: string | null) {
  return placements
    .map((placement, index) => ({ placement, index }))
    .sort((a, b) => {
      const lifted = Number(a.placement.id === selectedId) - Number(b.placement.id === selectedId);
      return lifted || layerOf(a.placement.subCategoryId) - layerOf(b.placement.subCategoryId) || a.index - b.index;
    })
    .map((entry) => entry.placement);
}

export const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'text'> = { x: 0.5, y: 0.62, scale: 1, rotation: 0 };
