import type { TextLayer } from '@/api/builderModels';

/**
 * Free-design studios. The company decides WHAT can be added (the category's components
 * and base products); the customer decides WHERE and HOW: any position, size, rotation
 * and layer order inside the canvas. Jewelry keeps its own strand studio.
 */
export type CanvasBuilder = 'BOUQUET' | 'GIFT';
export const CANVAS_BUILDERS: readonly CanvasBuilder[] = ['BOUQUET', 'GIFT'];

export function isCanvasBuilder(value: unknown): value is CanvasBuilder {
  return CANVAS_BUILDERS.includes(value as CanvasBuilder);
}

/** Position (centre, 0–1 of the canvas), size multiplier and rotation in degrees. */
export type Transform = { x: number; y: number; scale: number; rotation: number };

/**
 * A family of components, used only to organise the picker into filters and to give a
 * new piece a sensible starting size. It never decides where a piece goes. Matching is
 * by keyword on the admin-set SubCategory.type, so "ROSE", "Flowers" or "flower-head"
 * all work; unrecognised types are still offered under "All".
 */
export type GroupKey = 'FLOWERS' | 'GREENERY' | 'FILLERS' | 'DECORATIONS' | 'WRAPPING' | 'ITEMS' | 'FILLER' | 'CONTAINER';

/** A picker group; its name is translated as studio.groups.<key>. */
export interface ComponentGroup {
  key: GroupKey;
  match: RegExp;
  /** Edge of a new piece at scale 1, as a share of the canvas. */
  base: number;
}

const BOUQUET_GROUPS: ComponentGroup[] = [
  { key: 'FLOWERS', match: /FLOWER|BLOOM|ROSE|TULIP|LILY|PEONY|STEM/, base: 0.24 },
  { key: 'GREENERY', match: /GREEN|LEAF|LEAV|FOLIAGE|FERN|EUCALYPT/, base: 0.3 },
  { key: 'FILLERS', match: /FILL|BREATH|GYPSOPHILA/, base: 0.2 },
  { key: 'DECORATIONS', match: /DECOR|RIBBON|BOW|CARD|TAG|PEARL/, base: 0.2 },
  { key: 'WRAPPING', match: /WRAP|PAPER|SLEEVE|CONE/, base: 0.6 },
];

// Gift pieces start small so several fit on the bag's front; customers resize freely.
const GIFT_GROUPS: ComponentGroup[] = [
  { key: 'ITEMS',
    match: /ITEM|PRODUCT|MUG|CUP|FOOD|SWEET|CHOC|COOKIE|DRINK|COFFEE|TEA|CANDLE|TOY|BEAR/, base: 0.2 },
  { key: 'DECORATIONS',
    match: /DECOR|RIBBON|BOW|CARD|HEART|TAG|FLOWER|ROSE|STICKER|BALLOON/, base: 0.14 },
  { key: 'FILLER', match: /FILL|SHRED|STRAW|NEST/, base: 0.28 },
  { key: 'CONTAINER', match: /BAG|BOX|BASKET|CONTAINER|PACKAG|HAMPER/, base: 0.6 },
];

const GROUPS: Record<CanvasBuilder, ComponentGroup[]> = { BOUQUET: BOUQUET_GROUPS, GIFT: GIFT_GROUPS };
const MAIN_GROUP: Record<CanvasBuilder, GroupKey> = { BOUQUET: 'FLOWERS', GIFT: 'ITEMS' };

/** Groups in picker filter order. */
export function groupsFor(builder: CanvasBuilder) {
  return GROUPS[builder];
}

/** The group of a SubCategory, from its admin-set type; unknown types use the main group's size. */
export function groupOf(builder: CanvasBuilder, type: string | null | undefined): ComponentGroup {
  const normalized = (type ?? '').toUpperCase();
  return (normalized && GROUPS[builder].find((group) => group.match.test(normalized)))
    || GROUPS[builder].find((group) => group.key === MAIN_GROUP[builder])!;
}

/** Whether a type is recognised (unrecognised items are shown under "All" only). */
export function hasKnownGroup(builder: CanvasBuilder, type: string | null | undefined) {
  const normalized = (type ?? '').toUpperCase();
  return !!normalized && GROUPS[builder].some((group) => group.match.test(normalized));
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Sizes customers can choose, relative to a piece's starting size. */
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 3;
/** How close to the canvas edge a piece's centre may go: it never leaves the canvas. */
const EDGE = 0.03;

/**
 * The only placement rule of a free studio: a piece stays on the canvas. Anywhere inside
 * it, at any size within reason and any rotation, is the customer's choice.
 */
export function clampToCanvas(transform: Transform): Transform {
  return {
    x: clamp(transform.x, EDGE, 1 - EDGE),
    y: clamp(transform.y, EDGE, 1 - EDGE),
    scale: clamp(transform.scale, MIN_SCALE, MAX_SCALE),
    rotation: clamp(transform.rotation, -360, 360),
  };
}

/** A rectangle on the canvas, in fractions (0–1). */
export interface Bounds { left: number; top: number; right: number; bottom: number }

/**
 * The front of the drawn gift bag. The drawing and the placement limit both use it, so
 * the outline the customer sees is exactly where pieces may go.
 */
export const GIFT_BAG: Bounds = { left: 0.12, top: 0.27, right: 0.88, bottom: 0.96 };

/**
 * The front of a rectangular gift box: wider and lower than the square one (which uses the
 * bag's area), so long pieces like jewelry and chocolate bars lie naturally inside.
 */
export const GIFT_BOX_RECTANGULAR: Bounds = { left: 0.06, top: 0.38, right: 0.94, bottom: 0.9 };

/**
 * Where pieces must stay. Items go into the drawn gift bag or box, like in the real one; a
 * base product photo (where the container's edges are unknown) and bouquets use the canvas.
 */
export function boundsFor(builder: CanvasBuilder, hasBasePhoto: boolean,
  shape?: 'SQUARE' | 'RECTANGULAR' | null): Bounds | null {
  if (builder !== 'GIFT' || hasBasePhoto) return null;
  return shape === 'RECTANGULAR' ? GIFT_BOX_RECTANGULAR : GIFT_BAG;
}

/**
 * Keeps a whole piece inside `bounds`: its rotated footprint, not only its centre, and
 * never larger than the bounds. `box` is the piece at scale 1, as shares of the canvas.
 * Without bounds, the canvas rule applies.
 */
export function clampInside(transform: Transform, box: { width: number; height: number },
  bounds: Bounds | null): Transform {
  const free = clampToCanvas(transform);
  if (!bounds) return free;
  const radians = (free.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  // Footprint of the rotated box at scale 1.
  const spanX = box.width * cos + box.height * sin;
  const spanY = box.width * sin + box.height * cos;
  const fit = Math.min((bounds.right - bounds.left) / spanX, (bounds.bottom - bounds.top) / spanY);
  const scale = clamp(free.scale, Math.min(MIN_SCALE, fit), Math.min(MAX_SCALE, fit));
  const halfX = (spanX * scale) / 2;
  const halfY = (spanY * scale) / 2;
  return {
    x: clamp(free.x, bounds.left + halfX, bounds.right - halfX),
    y: clamp(free.y, bounds.top + halfY, bounds.bottom - halfY),
    scale,
    rotation: free.rotation,
  };
}

/**
 * Where a tapped (not dragged) piece appears: near the middle of the canvas, or of the gift
 * bag, each one slightly offset so repeated taps don't stack exactly. The customer then
 * moves it wherever they like.
 */
export function dropPosition(count: number, around?: Bounds | null): Transform {
  const step = count % 9;
  const centreX = around ? (around.left + around.right) / 2 : 0.5;
  const centreY = around ? (around.top + around.bottom) / 2 : 0.42;
  return clampToCanvas({
    x: centreX + ((step % 3) - 1) * 0.12,
    y: centreY + (Math.floor(step / 3) - 1) * 0.1,
    scale: 1,
    rotation: 0,
  });
}

/** Text box at scale 1, as shares of the canvas. */
export const TEXT_BOX = { width: 0.56, height: 0.13 };

/** Box of a piece at scale 1 (square photos), as shares of the canvas. */
export const pieceBox = (group: ComponentGroup) => ({ width: group.base, height: group.base });

export const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'text'> = { x: 0.5, y: 0.62, scale: 1, rotation: 0 };
