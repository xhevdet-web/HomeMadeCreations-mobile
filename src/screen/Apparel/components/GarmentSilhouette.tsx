import { useId } from 'react';
import Svg, { Defs, G, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import type { DesignSide } from '@/api/builderModels';
import type { Silhouette } from '@/helper/apparel';

// Drawn garments (100×100 viewBox) used until a category has mockup photos. They are
// tinted with the selected colour, with soft shading so the fabric reads as 3D.
const SHAPES: Record<Silhouette, { body: string; details: Record<DesignSide, string[]>;
  overlay?: Record<DesignSide, string> }> = {
  TSHIRT: {
    body: 'M35 10 Q50 17 65 10 L82 15 L97 33 L85 42 L78 37 L78 93 Q50 96 22 93 L22 37 L15 42 L3 33 L18 15 Z',
    details: {
      FRONT: ['M37 10.6 Q50 22 63 10.6', 'M22 37 L22 42', 'M78 37 L78 42'],
      BACK: ['M37 10.6 Q50 15 63 10.6'],
    },
  },
  HOODIE: {
    body: 'M31 15 L69 15 L86 22 L97 70 L87 73 L78 41 L78 91 Q50 94 22 91 L22 41 L13 73 L3 70 L14 22 Z',
    overlay: {
      FRONT: 'M34 17 Q33 3 50 3 Q67 3 66 17 Q58 23 50 23 Q42 23 34 17 Z',
      BACK: 'M35 16 Q34 2 50 2 Q66 2 65 16 Q60 31 50 32 Q40 31 35 16 Z',
    },
    details: {
      FRONT: [
        'M40 16 Q50 26 60 16 Q57 8 50 8 Q43 8 40 16 Z',
        'M45 23 L44 35', 'M55 23 L56 35',
        'M32 64 L68 64 L73 83 L27 83 Z',
        'M23 87 Q50 90 77 87',
      ],
      BACK: ['M23 87 Q50 90 77 87', 'M50 4 L50 30'],
    },
  },
};

function shade(color: string, amount: number) {
  const hex = /^#?([0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return 'rgba(0,0,0,0.25)';
  const mix = (index: number) => {
    const channel = parseInt(hex.slice(index, index + 2), 16);
    return Math.round(amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount);
  };
  return `rgb(${mix(0)}, ${mix(2)}, ${mix(4)})`;
}

export function GarmentSilhouette({ silhouette, side, color, size }: {
  silhouette: Silhouette;
  side: DesignSide;
  color: string;
  size: number;
}) {
  const uid = useId().replace(/:/g, '');
  const shape = SHAPES[silhouette];
  const outline = shade(color, -0.35);
  const fold = shade(color, -0.18);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`light-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.18} />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.16} />
        </LinearGradient>
        <RadialGradient id={`shadow-${uid}`} cx="50%" cy="96%" rx="45%" ry="6%">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d="M10 96 Q50 100 90 96 Q50 92 10 96 Z" fill={`url(#shadow-${uid})`} />
      {shape.overlay && side === 'BACK' && (
        <Path d={shape.overlay.BACK} fill={color} stroke={outline} strokeWidth={0.6} />
      )}
      <Path d={shape.body} fill={color} stroke={outline} strokeWidth={0.6} strokeLinejoin="round" />
      <Path d={shape.body} fill={`url(#light-${uid})`} />
      {shape.overlay && side === 'FRONT' && (
        <Path d={shape.overlay.FRONT} fill={color} stroke={outline} strokeWidth={0.6} />
      )}
      <G>
        {shape.details[side].map((d, index) => d.endsWith('Z') ? (
          <Path key={index} d={d} fill={index === 0 && silhouette === 'HOODIE' && side === 'FRONT'
            ? shade(color, -0.45) : 'none'} stroke={fold} strokeWidth={0.5} />
        ) : (
          <Path key={index} d={d} fill="none" stroke={fold} strokeWidth={0.6} strokeLinecap="round" />
        ))}
      </G>
      {/* Soft centre fold so the fabric doesn't look flat. */}
      <Line x1={50} y1={silhouette === 'HOODIE' ? 26 : 22} x2={50} y2={88} stroke={fold}
        strokeWidth={0.25} opacity={0.35} />
    </Svg>
  );
}
