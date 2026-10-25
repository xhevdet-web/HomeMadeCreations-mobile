import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CanvasBuilder } from '@/helper/canvasStudio';

// A seamless photo-studio sweep: a lit wall curving into the floor, with a soft contact
// shadow where the piece stands. The tones are the studio's, not the app theme's, so the
// photographed components look the same in light and dark mode. Each studio has its own
// light: a warm florist's table for bouquets, a soft blush for gifts.
const TONES: Record<CanvasBuilder | 'NEUTRAL', { wall: readonly [string, string]; floor: readonly [string, string] }> = {
  BOUQUET: { wall: ['#FBF8F1', '#EFEADC'], floor: ['#E7E1D0', '#DCD4BF'] },
  GIFT: { wall: ['#FDF7F5', '#F4E8E4'], floor: ['#EEDDD7', '#E4CEC7'] },
  NEUTRAL: { wall: ['#FBF9F6', '#F1ECE5'], floor: ['#ECE5DC', '#E2D9CE'] },
};

/**
 * The backdrop behind a canvas studio. Bouquet and gift previews are captured with it, as
 * a product photo, so they need no transparency and stay small as JPEG.
 */
export function PhotoStage({ shadowY = 0.86, tone = 'NEUTRAL' }: {
  /** Floor contact point, as a fraction of the height. */
  shadowY?: number;
  tone?: CanvasBuilder | 'NEUTRAL';
}) {
  const uid = useId().replace(/:/g, '');
  const { wall: WALL, floor: FLOOR } = TONES[tone];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={WALL[0]} />
            <Stop offset="0.62" stopColor={WALL[1]} />
            <Stop offset="0.74" stopColor={FLOOR[0]} />
            <Stop offset="1" stopColor={FLOOR[1]} />
          </LinearGradient>
          {/* A soft key light from above, brighter where the piece sits. */}
          <RadialGradient id={`light-${uid}`} cx="50%" cy="38%" r="60%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`shadow-${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#5A4636" stopOpacity={0.22} />
            <Stop offset="0.6" stopColor="#5A4636" stopOpacity={0.08} />
            <Stop offset="1" stopColor="#5A4636" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#wall-${uid})`} />
        <Rect width="100" height="100" fill={`url(#light-${uid})`} />
        <Ellipse cx="50" cy={shadowY * 100} rx="30" ry="4.5" fill={`url(#shadow-${uid})`} />
      </Svg>
    </View>
  );
}
