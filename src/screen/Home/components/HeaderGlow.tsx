import { useEffect, useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

/**
 * Soft light drifting behind Home's header: a few blurred orbs in the brand colours move and
 * breathe slowly. Positions are shares of the header, so it fits any screen. It stays still
 * when the system asks for reduced motion.
 */
const ORBS = [
  { size: 0.95, from: [-0.25, -0.3], to: [0.15, -0.05], duration: 9000, tone: 0 },
  { size: 0.8, from: [0.55, 0.35], to: [0.2, 0.55], duration: 11000, tone: 1 },
  { size: 0.6, from: [0.7, -0.2], to: [0.45, 0.1], duration: 7000, tone: 2 },
] as const;

const TONES = {
  dark: [{ color: '#F9B17A', opacity: 0.32 }, { color: '#8F96C9', opacity: 0.4 }, { color: '#F2C6A4', opacity: 0.22 }],
  light: [{ color: '#F9B17A', opacity: 0.45 }, { color: '#E8B4BC', opacity: 0.45 }, { color: '#FFFFFF', opacity: 0.8 }],
};

export function HeaderGlow() {
  const theme = useTheme();
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}
      onLayout={(event) => setFrame(event.nativeEvent.layout)}>
      {frame && ORBS.map((orb, index) => (
        <Orb key={index} frame={frame} {...orb} {...TONES[theme.mode][orb.tone]} />
      ))}
    </View>
  );
}

function Orb({ frame, size, from, to, duration, color, opacity }: {
  frame: { width: number; height: number };
  size: number;
  from: readonly [number, number];
  to: readonly [number, number];
  duration: number;
  color: string;
  opacity: number;
}) {
  const id = `glow-${useId().replace(/:/g, '')}`;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    progress.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(progress);
  }, [duration, progress, reduceMotion]);

  const diameter = frame.width * size;
  const start = { x: from[0] * frame.width, y: from[1] * frame.height };
  const end = { x: to[0] * frame.width, y: to[1] * frame.height };
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: start.x + (end.x - start.x) * progress.value },
      { translateY: start.y + (end.y - start.y) * progress.value },
      { scale: 1 + 0.15 * progress.value },
    ],
  }));

  return (
    <Animated.View style={[styles.orb, { width: diameter, height: diameter }, style]}>
      <Svg width={diameter} height={diameter}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.45} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={diameter / 2} cy={diameter / 2} r={diameter / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', left: 0, top: 0 },
});
