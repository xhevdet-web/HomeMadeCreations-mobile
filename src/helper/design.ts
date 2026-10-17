import { DesignItem, JewelryType } from '@/types/models';
export const uniqueId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const normalizePositions = (items: DesignItem[]) =>
  items.map((item, position) => ({ ...item, position }));

// All canvas geometry lives in a 320×320 design space and is scaled to the view.
const GEOMETRY: Record<JewelryType, { cx: number; cy: number; rx: number; ry: number }> = {
  bracelet: { cx: 160, cy: 160, rx: 128, ry: 112 },
  necklace: { cx: 160, cy: 158, rx: 124, ry: 132 },
};
export const ringGeometry = (type: JewelryType) => GEOMETRY[type];

const BEAD_GAP = 1.04;
const MAX_BEAD_RADIUS = 20;
const MAX_MAGNIFICATION = 1.8;
const DEFAULT_CAPACITY = 24;
// The canvas always shows a circle sized for at least this many beads; it grows after.
const BASE_SLOTS = 10;
// Never let the starting circle get smaller than this share of the canvas.
const MIN_RING_SCALE = 0.5;

// Largest bead radius that fits `count` touching beads on a ring of `scale`. Uses the
// straight-line distance between neighbours on the tighter axis, so short strands
// (where the chord is much shorter than the arc) never overlap.
const radiusFor = (count: number, scale: number, minAxis: number) =>
  (minAxis * scale * Math.sin(Math.PI / count)) / BEAD_GAP;

/**
 * Auto-zoom for the strand. The piece starts as a visible circle with BASE_SLOTS bead
 * slots; beads fill it as a touching arc. Past BASE_SLOTS the circle grows with each
 * bead until it fills the canvas, then beads get smaller so a full piece still fits.
 * Short strands are magnified (up to MAX_MAGNIFICATION) so a few beads look rich.
 * `scale` is the ring size (1 = full canvas), `beadRadius` the on-screen bead radius in
 * design space, `slots` the positions around the ring and `offset` the ring fraction
 * where bead 0 sits (the arc is centred at the bottom, like beads hanging on a cord).
 */
export function ringLayout(count: number, type: JewelryType, capacity?: number | null) {
  const { rx, ry } = GEOMETRY[type];
  const minAxis = Math.min(rx, ry);
  const cap = Math.max(capacity || DEFAULT_CAPACITY, count, BASE_SLOTS);
  const slots = Math.max(count, BASE_SLOTS);
  const physicalRadius = radiusFor(cap, 1, minAxis);
  const fill = slots / cap;
  let beadRadius = Math.min(MAX_BEAD_RADIUS, physicalRadius * Math.min(MAX_MAGNIFICATION, 1 / fill));
  let scale = (beadRadius * BEAD_GAP) / (minAxis * Math.sin(Math.PI / slots));
  if (scale > 1) {
    scale = 1;
    beadRadius = radiusFor(slots, 1, minAxis);
  }
  scale = Math.max(scale, MIN_RING_SCALE);
  const offset = 0.5 - Math.max(count - 1, 0) / (2 * slots);
  return { scale, beadRadius, slots, offset };
}
export type RingLayout = ReturnType<typeof ringLayout>;

/** Position of bead `index` (or empty slot `index`) for a layout, in design space. */
export function slotPosition(index: number, type: JewelryType, layout: RingLayout) {
  return itemPosition(index, layout.slots, type, layout.offset + index / layout.slots, layout.scale);
}

/** Index of the bead nearest to a design-space point. */
export function nearestBead(point: { x: number; y: number }, count: number, type: JewelryType,
  layout: RingLayout) {
  let best = { index: -1, distance: Infinity };
  for (let index = 0; index < count; index++) {
    const position = slotPosition(index, type, layout);
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < best.distance) best = { index, distance };
  }
  return best;
}

export function itemPosition(
  index: number,
  count: number,
  type: JewelryType,
  placement?: number,
  scale = 1,
) {
  const { cx, cy, rx, ry } = GEOMETRY[type];
  const angle = (placement ?? index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + rx * scale * Math.cos(angle), y: cy + ry * scale * Math.sin(angle) };
}
export function angleFromPoint(x: number, y: number, type: JewelryType) {
  const { cx, cy, rx, ry } = GEOMETRY[type];
  const radians = Math.atan2((y - cy) / ry, (x - cx) / rx);
  return ((radians + Math.PI / 2) / (Math.PI * 2) + 1) % 1;
}
