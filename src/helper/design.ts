import { DesignItem, JewelryType } from '@/types/models';
export const uniqueId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const normalizePositions = (items: DesignItem[]) =>
  items.map((item, position) => ({ ...item, position }));

type Point = { x: number; y: number };

// All canvas geometry lives in a 320×320 design space and is scaled to the view.
// Each piece is a closed curve starting at the top (the clasp) and running clockwise;
// zooming scales the curve about its centre.
const SHAPES: Record<JewelryType, { cx: number; cy: number; point: (theta: number) => Point }> = {
  bracelet: {
    cx: 160, cy: 160,
    point: (theta) => ({ x: 160 + 128 * Math.sin(theta), y: 160 - 112 * Math.cos(theta) }),
  },
  // A hanging necklace: narrow where it rests around the neck, full and round at the front.
  necklace: {
    cx: 160, cy: 150,
    point: (theta) => {
      const width = 0.68 + 0.32 * (1 - Math.cos(theta)) / 2;
      return { x: 160 + 130 * width * Math.sin(theta), y: 150 - 134 * Math.cos(theta) };
    },
  },
};
export const shapeCentre = (type: JewelryType) => ({ cx: SHAPES[type].cx, cy: SHAPES[type].cy });

// Arc-length tables so beads sit evenly along any curve, not just along an ellipse.
const SAMPLES = 1024;
const tables = new Map<JewelryType, { points: Point[]; lengths: number[]; total: number }>();
function table(type: JewelryType) {
  let entry = tables.get(type);
  if (!entry) {
    const points = Array.from({ length: SAMPLES + 1 }, (_, index) =>
      SHAPES[type].point((index / SAMPLES) * Math.PI * 2));
    const lengths = [0];
    for (let index = 1; index <= SAMPLES; index++)
      lengths.push(lengths[index - 1] + Math.hypot(points[index].x - points[index - 1].x,
        points[index].y - points[index - 1].y));
    entry = { points, lengths, total: lengths[SAMPLES] };
    tables.set(type, entry);
  }
  return entry;
}

/** Point at `fraction` (0–1 of the curve length, 0 = top) at full size. */
function curvePoint(type: JewelryType, fraction: number): Point {
  const { points, lengths, total } = table(type);
  const target = (((fraction % 1) + 1) % 1) * total;
  let low = 0;
  let high = SAMPLES;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (lengths[mid] <= target) low = mid; else high = mid;
  }
  const span = lengths[high] - lengths[low] || 1;
  const t = (target - lengths[low]) / span;
  return {
    x: points[low].x + (points[high].x - points[low].x) * t,
    y: points[low].y + (points[high].y - points[low].y) * t,
  };
}

/** Full-size point, scaled about the shape centre. */
export function scalePoint(type: JewelryType, point: Point, scale: number): Point {
  const { cx, cy } = SHAPES[type];
  return { x: cx + (point.x - cx) * scale, y: cy + (point.y - cy) * scale };
}

/** SVG path of the cord at a given zoom. */
export function cordPath(type: JewelryType, scale: number) {
  const { points } = table(type);
  return points.filter((_, index) => index % 8 === 0).map((point, index) => {
    const p = scalePoint(type, point, scale);
    return `${index ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ') + ' Z';
}

const BEAD_GAP = 1.04;
const MAX_BEAD_RADIUS = 20;
const MAX_MAGNIFICATION = 1.8;
const DEFAULT_CAPACITY = 24;
// The canvas always shows the piece sized for at least this many beads; it grows after.
const BASE_SLOTS = 10;
// Never let the starting piece get smaller than this share of the canvas.
const MIN_RING_SCALE = 0.5;

// Shortest straight-line distance between neighbouring slots at full size. Using the
// chord (not the arc) keeps short strands from overlapping on tight curves.
const chords = new Map<string, number>();
function minChord(type: JewelryType, slots: number) {
  const key = type + ':' + slots;
  let chord = chords.get(key);
  if (chord === undefined) {
    chord = Infinity;
    for (let index = 0; index < slots; index++) {
      const a = curvePoint(type, index / slots);
      const b = curvePoint(type, (index + 1) / slots);
      chord = Math.min(chord, Math.hypot(a.x - b.x, a.y - b.y));
    }
    chords.set(key, chord);
  }
  return chord;
}
const radiusFor = (type: JewelryType, slots: number, scale: number) =>
  (minChord(type, slots) * scale) / (2 * BEAD_GAP);

/**
 * Auto-zoom for the strand. The piece starts at a visible size with BASE_SLOTS bead
 * slots; beads fill it as a touching arc. Past BASE_SLOTS the piece grows with each
 * bead until it fills the canvas, then beads get smaller so a full piece still fits.
 * Short strands are magnified (up to MAX_MAGNIFICATION) so a few beads look rich.
 * `scale` is the piece size (1 = full canvas), `beadRadius` the on-screen bead radius in
 * design space, `slots` the positions along the cord and `offset` the fraction where
 * bead 0 sits (the arc is centred at the bottom, like beads hanging on a cord).
 */
export function ringLayout(count: number, type: JewelryType, capacity?: number | null) {
  const cap = Math.max(capacity || DEFAULT_CAPACITY, count, BASE_SLOTS);
  const slots = Math.max(count, BASE_SLOTS);
  const physicalRadius = radiusFor(type, cap, 1);
  const fill = slots / cap;
  let beadRadius = Math.min(MAX_BEAD_RADIUS, physicalRadius * Math.min(MAX_MAGNIFICATION, 1 / fill));
  let scale = (2 * beadRadius * BEAD_GAP) / minChord(type, slots);
  if (scale > 1) {
    scale = 1;
    beadRadius = radiusFor(type, slots, 1);
  }
  scale = Math.max(scale, MIN_RING_SCALE);
  const offset = 0.5 - Math.max(count - 1, 0) / (2 * slots);
  return { scale, beadRadius, slots, offset };
}
export type RingLayout = ReturnType<typeof ringLayout>;

/** Full-size position of slot `index` for a layout (before zoom). */
export function slotBasePoint(index: number, type: JewelryType, layout: RingLayout | MeasuredRingLayout) {
  const centers = centersOf(layout);
  if (centers) return curvePoint(type, centers[index] ?? layout.offset);
  return curvePoint(type, layout.offset + index / layout.slots);
}

/** Position of bead `index` (or empty slot `index`) for a layout, in design space. */
export function slotPosition(index: number, type: JewelryType, layout: RingLayout | MeasuredRingLayout) {
  return scalePoint(type, slotBasePoint(index, type, layout), layout.scale);
}

/** Index of the bead nearest to a design-space point. */
export function nearestBead(point: Point, count: number, type: JewelryType,
  layout: RingLayout | MeasuredRingLayout) {
  let best = { index: -1, distance: Infinity };
  for (let index = 0; index < count; index++) {
    const position = slotPosition(index, type, layout);
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < best.distance) best = { index, distance };
  }
  return best;
}

/** Share of the canvas a true-scale bracelet is drawn at; beads (up to ~12 mm) stay inside. */
const MEASURED_RING_SCALE = 0.86;

/**
 * True-scale layout for a bracelet sized by length. The drawn cord stands for the chosen
 * length, and every piece takes its real share of it: a 12 mm bead covers 1.5× the cord of
 * an 8 mm one, and what is still empty shows as a gap at the top, by the clasp. Pieces
 * hang centred at the bottom, like beads on a cord. `lengths` are the pieces' sizes in mm,
 * in strand order; `unitPerMm` converts mm to design units at the drawn size.
 */
export function measuredRingLayout(lengths: number[], type: JewelryType, selectedMm: number, typicalMm: number) {
  const scale = MEASURED_RING_SCALE;
  const unitPerMm = (table(type).total * scale) / selectedMm;
  const used = lengths.reduce((sum, length) => sum + length, 0);
  const start = 0.5 - used / (2 * selectedMm);
  const boundaries = [start];
  const centers: number[] = [];
  for (const length of lengths) {
    const from = boundaries[boundaries.length - 1];
    centers.push(from + length / (2 * selectedMm));
    boundaries.push(from + length / selectedMm);
  }
  return {
    scale,
    // A typical piece's radius; each piece is drawn at its own length relative to it.
    beadRadius: (typicalMm / 2) * unitPerMm,
    slots: Math.max(lengths.length, 1),
    offset: start,
    unitPerMm,
    typicalMm,
    centers,
    boundaries,
  };
}
export type MeasuredRingLayout = ReturnType<typeof measuredRingLayout>;
type AnyLayout = RingLayout | MeasuredRingLayout;

/** Fractions along the cord of a true-scale layout, or undefined for evenly spaced ones. */
const centersOf = (layout: AnyLayout) => ('centers' in layout ? layout.centers : undefined);

/**
 * Where a new piece dropped at `point` goes: the nearest gap between pieces (or either end)
 * of a true-scale layout.
 */
export function nearestBoundary(point: Point, type: JewelryType, layout: MeasuredRingLayout) {
  let best = { index: 0, distance: Infinity };
  layout.boundaries.forEach((fraction, index) => {
    const position = scalePoint(type, curvePoint(type, fraction), layout.scale);
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < best.distance) best = { index, distance };
  });
  return best;
}
