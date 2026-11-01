import { memo, useId } from 'react';
import Svg, { ClipPath, Defs, Ellipse, G, Image as SvgImage, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import {
  PREVIEW_PRINT_SHARE_OF_CIRCUMFERENCE, PREVIEW_PRINT_SHARE_OF_HEIGHT, type MugPrintArea,
} from '@/helper/mugs';

// The real product is a white mug, so it is drawn white in both app themes.
const WHITE = '#FFFFFF';
const EDGE = '#D9D9DE';
const INSIDE = '#ECECEF';
/** Strips the visible half of the mug is drawn in; more is smoother and slower. */
const STRIPS = 36;
/** Body height ÷ diameter of a standard mug (visual only). */
const BODY_ASPECT = 1.15;

/**
 * A white mug with its handle on one side, wearing the flat print. The mug shows half its
 * circumference: with the handle on the right, the right half of the print (which ends at
 * the handle); on the left, the left half. The print is mapped in thin vertical strips,
 * each compressed by the curve, so it wraps like on the real mug. A visual preview only:
 * production prints the flat file.
 */
export const MugMockup = memo(function MugMockup({ printUri, area, width, handle }: {
  /** The captured flat print. */
  printUri: string;
  area: MugPrintArea;
  /** Width of the whole picture, handle included. */
  width: number;
  handle: 'left' | 'right';
}) {
  const id = useId().replace(/:/g, '');
  const radius = width * 0.36;
  const rimY = radius * 0.17;
  const bodyHeight = radius * 2 * BODY_ASPECT;
  const height = bodyHeight + rimY * 2 + 4;
  const cx = handle === 'right' ? width * 0.42 : width * 0.58;
  const top = rimY + 2;
  const bottom = top + bodyHeight;
  const left = cx - radius;
  const right = cx + radius;
  const body = `M${left},${top} L${left},${bottom} A${radius},${rimY} 0 0 0 ${right},${bottom} L${right},${top} `
    + `A${radius},${rimY} 0 0 1 ${left},${top} Z`;

  // Print placement on the body: centred vertically, mm → points along the surface.
  const printHeight = bodyHeight * PREVIEW_PRINT_SHARE_OF_HEIGHT;
  const printTop = top + (bodyHeight - printHeight) / 2 + rimY * 0.4;
  const circumference = area.widthMm / PREVIEW_PRINT_SHARE_OF_CIRCUMFERENCE;
  const half = area.widthMm / 2;
  // Print position (mm from its left edge) seen at angle θ (0 = facing the viewer).
  const printAt = (theta: number) => handle === 'right'
    ? half + ((theta + 90) / 360) * circumference
    : half - ((90 - theta) / 360) * circumference;
  const strips = Array.from({ length: STRIPS }, (_, index) => {
    const from = -90 + (180 * index) / STRIPS;
    const to = -90 + (180 * (index + 1)) / STRIPS;
    const x1 = cx + radius * Math.sin((from * Math.PI) / 180);
    const x2 = cx + radius * Math.sin((to * Math.PI) / 180);
    const u1 = printAt(from);
    const u2 = printAt(to);
    const perMm = (x2 - x1) / (u2 - u1);
    return { index, x1, x2, u1, u2, perMm };
  }).filter((strip) => strip.u2 > 0 && strip.u1 < area.widthMm);

  // Handle: a thick rounded loop from the upper to the lower body.
  const side = handle === 'right' ? 1 : -1;
  const edgeX = handle === 'right' ? right - 2 : left + 2;
  const reach = radius * 0.62;
  const handlePath = `M${edgeX},${top + bodyHeight * 0.2} `
    + `C${edgeX + side * reach},${top + bodyHeight * 0.14} ${edgeX + side * reach * 1.05},${top + bodyHeight * 0.72} `
    + `${edgeX},${top + bodyHeight * 0.74}`;
  const handleWidth = radius * 0.2;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <ClipPath id={`body-${id}`}>
          <Path d={body} />
        </ClipPath>
        {strips.map((strip) => (
          <ClipPath key={strip.index} id={`strip-${id}-${strip.index}`}>
            {/* A hair wider than the strip so no seam shows between neighbours. */}
            <Rect x={strip.x1 - 0.3} y={printTop} width={strip.x2 - strip.x1 + 0.6} height={printHeight} />
          </ClipPath>
        ))}
        <LinearGradient id={`shade-${id}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.16} />
          <Stop offset="0.18" stopColor="#000000" stopOpacity={0.03} />
          <Stop offset="0.38" stopColor="#FFFFFF" stopOpacity={0.35} />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.82" stopColor="#000000" stopOpacity={0.04} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.18} />
        </LinearGradient>
      </Defs>

      {/* Handle behind the body: a soft outline, then the white loop. */}
      <Path d={handlePath} fill="none" stroke={EDGE} strokeWidth={handleWidth + 3} strokeLinecap="round" />
      <Path d={handlePath} fill="none" stroke={WHITE} strokeWidth={handleWidth} strokeLinecap="round" />

      <Path d={body} fill={WHITE} stroke={EDGE} strokeWidth={1.2} />
      <G clipPath={`url(#body-${id})`}>
        {strips.map((strip) => (
          <G key={strip.index} clipPath={`url(#strip-${id}-${strip.index})`}>
            <SvgImage href={{ uri: printUri }} preserveAspectRatio="none"
              x={strip.x1 - strip.u1 * strip.perMm} y={printTop}
              width={area.widthMm * strip.perMm} height={printHeight} />
          </G>
        ))}
        <Rect x={left} y={0} width={radius * 2} height={height} fill={`url(#shade-${id})`} />
      </G>

      {/* Rim and opening. */}
      <Ellipse cx={cx} cy={top} rx={radius} ry={rimY} fill={WHITE} stroke={EDGE} strokeWidth={1.2} />
      <Ellipse cx={cx} cy={top + 1} rx={radius * 0.9} ry={rimY * 0.78} fill={INSIDE} />
    </Svg>
  );
});

/** Height of a MugMockup drawn `width` points wide. */
export const mugMockupHeight = (width: number) => {
  const radius = width * 0.36;
  return radius * 2 * BODY_ASPECT + radius * 0.17 * 2 + 4;
};
