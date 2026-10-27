import Svg, { Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

// Fine line-art in the studio's own ink, like StudioScene, so it reads the same on the
// light photo stage in both app themes. The packaging colour is the real material colour.
const INK = '#9C8A79';
/** A closed box without colours of its own: plain kraft card. */
export const KRAFT = '#C8A27A';

/** Relative luminance (0 dark – 1 light) of a #RRGGBB colour. */
export function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The colour lit (amount > 0, towards white) or in shadow (amount < 0, towards black). */
export function shade(hex: string, amount: number) {
  const target = amount > 0 ? 255 : 0;
  const mix = Math.min(Math.abs(amount), 1);
  return '#' + [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16);
    return Math.round(value + (target - value) * mix).toString(16).padStart(2, '0');
  }).join('');
}

/**
 * A satin bow: two loops, two tails and a knot, in the ribbon colour with a sheen.
 * Drawn around (x, y) at the given scale (1 = about 34 units wide).
 */
export function Bow({ x, y, scale = 1, color }: { x: number; y: number; scale?: number; color: string }) {
  const dark = shade(color, -0.25);
  const sheen = shade(color, 0.35);
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} stroke={dark} strokeWidth={0.5} strokeLinejoin="round">
      {/* Tails fall from the knot. */}
      <Path d="M-1.5 1 L-9 13 L-6 12 L-5 15 L1 2 Z" fill={color} />
      <Path d="M1.5 1 L9 13 L6 12 L5 15 L-1 2 Z" fill={dark} />
      {/* Loops, each with its satin sheen. */}
      <Path d="M-1 -1 C-8 -11 -18 -9 -16 -2 C-15 3 -7 3 -1 1 Z" fill={color} />
      <Path d="M1 -1 C8 -11 18 -9 16 -2 C15 3 7 3 1 1 Z" fill={color} />
      <Path d="M-4 -2 C-8 -7 -13 -6 -13 -3" fill="none" stroke={sheen} strokeWidth={1.1} strokeLinecap="round" />
      <Path d="M4 -2 C8 -7 13 -6 13 -3" fill="none" stroke={sheen} strokeWidth={1.1} strokeLinecap="round" />
      <Ellipse cx={0} cy={0} rx={3.2} ry={2.6} fill={shade(color, -0.1)} />
    </G>
  );
}

type Point = [number, number];
const add = ([x, y]: Point, [dx, dy]: Point, by = 1): Point => [x + dx * by, y + dy * by];
const points = (list: Point[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/**
 * A box in 3/4 view, in canvas units: the lid's top-left corner, its front edge (u), its
 * side edge (v), the lid height and how far the body reaches below the lid's top.
 */
const BOXES = {
  SQUARE: { a: [13, 40] as Point, u: [34, 15] as Point, v: [42, -15] as Point, lid: 8, body: 32 },
  RECTANGULAR: { a: [9, 47] as Point, u: [48, 21] as Point, v: [30, -11] as Point, lid: 6, body: 24 },
};

/** A closed gift box in 3/4 view: lid, body, a ribbon crossing it in the box colour and a bow. */
function ClosedBox({ hex, shape }: { hex: string; shape: 'SQUARE' | 'RECTANGULAR' }) {
  const { a, u, v, lid, body } = BOXES[shape];
  const ribbon = shade(hex, luminance(hex) < 0.05 ? 0.12 : -0.14);
  const edge = shade(hex, -0.35);
  const b = add(a, v);
  const d = add(a, u);
  const c = add(d, v);
  const down = (point: Point, by: number): Point => [point[0], point[1] + by];
  // The two ribbon bands, each 6 units wide, cross at the middle of the lid.
  const along = (start: Point, edgeVector: Point, half: number): [Point, Point] =>
    [add(start, edgeVector, 0.5 - half), add(start, edgeVector, 0.5 + half)];
  const [p1, p2] = along(a, u, 3 / u[0]);
  const [q1, q2] = along(a, v, 3 / v[0]);
  const drop = body - 0.5;
  return (
    <G stroke={edge} strokeWidth={0.4} strokeLinejoin="round">
      <Ellipse cx={(a[0] + c[0]) / 2} cy={d[1] + body + 3} rx={(c[0] - a[0]) / 2} ry={4} fill="#5A4636"
        fillOpacity={0.14} stroke="none" />
      {/* Body: front-left face in light, right face in shadow. */}
      <Polygon points={points([add(a, [4, lid - 1]), down(d, lid - 2), down(d, body), add(a, [4, body + 1])])}
        fill={shade(hex, -0.06)} />
      <Polygon points={points([down(d, lid - 2), add(c, [-4, lid - 1]), add(c, [-4, body + 1]), down(d, body)])}
        fill={shade(hex, -0.28)} />
      {/* Lid, slightly larger than the body. */}
      <Polygon points={points([a, d, down(d, lid), down(a, lid)])} fill={shade(hex, 0.02)} />
      <Polygon points={points([d, c, down(c, lid), down(d, lid)])} fill={shade(hex, -0.2)} />
      <Polygon points={points([a, b, c, d])} fill={shade(hex, 0.12)} />
      {/* Ribbon across the lid and down both faces. */}
      <G stroke="none" fill={ribbon}>
        <Polygon points={points([p1, p2, add(p2, v), add(p1, v)])} />
        <Polygon points={points([q1, q2, add(q2, u), add(q1, u)])} />
        <Polygon points={points([p1, p2, down(p2, drop), down(p1, drop)])} />
        <Polygon points={points([add(q1, u), add(q2, u), down(add(q2, u), drop), down(add(q1, u), drop)])} />
      </G>
      {/* Satin sheen down each band. */}
      <Path d={`M${points([add(a, u, 0.5)])} L${points([down(add(a, u, 0.5), drop)])} `
        + `M${points([add(add(a, v, 0.5), u)])} L${points([down(add(add(a, v, 0.5), u), drop)])}`}
        stroke={shade(ribbon, 0.3)} strokeWidth={0.6} strokeOpacity={0.7} />
      <Bow x={a[0] + (u[0] + v[0]) / 2} y={a[1] + (u[1] + v[1]) / 2} scale={shape === 'RECTANGULAR' ? 1 : 1.2}
        color={ribbon} />
    </G>
  );
}

/** A clear gift bag: the contents stay visible. */
function ClearBag() {
  return (
    <G stroke={INK} strokeWidth={0.8} strokeLinejoin="round" strokeLinecap="round">
      <Ellipse cx={50} cy={89} rx={32} ry={4} fill="#5A4636" fillOpacity={0.12} stroke="none" />
      <Path d="M38 34 C38 16 62 16 62 34" fill="none" strokeWidth={1.4} />
      <Rect x={22} y={34} width={56} height={54} rx={2} fill="#FFFFFF" fillOpacity={0.35} />
      <Path d="M22 34 L28 40 L72 40 L78 34" fill="none" strokeOpacity={0.6} />
      <Path d="M29 46 L36 46 L29 60 Z" fill="#FFFFFF" fillOpacity={0.8} stroke="none" />
    </G>
  );
}

/**
 * Packaging drawn for options without a photo and for the packaged preview: a closed gift
 * box in its colour, or a clear bag. 2D on purpose: it shows the choice honestly without
 * pretending to be a photograph.
 */
export function PackagingArt({ closed, hex, shape = 'SQUARE', size }: {
  closed: boolean;
  hex?: string | null;
  shape?: 'SQUARE' | 'RECTANGULAR';
  size: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      {closed ? <ClosedBox hex={hex ?? KRAFT} shape={shape} /> : <ClearBag />}
    </Svg>
  );
}
