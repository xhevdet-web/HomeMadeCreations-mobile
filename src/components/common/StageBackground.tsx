import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

// A soft linen-like jewelry tray: lighter in the centre where the piece sits, with a
// faint woven texture so the surface reads as fabric rather than flat colour.
export function StageBackground() {
  const theme = useTheme();
  const uid = useId().replace(/:/g, '');
  const [centre, edge] = theme.gradients.stage;
  const thread = theme.mode === 'dark' ? '#FFFFFF' : '#8A6A45';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={`tray-${uid}`} cx="50%" cy="46%" r="72%">
            <Stop offset="0" stopColor={centre} />
            <Stop offset="0.55" stopColor={centre} stopOpacity={0.92} />
            <Stop offset="1" stopColor={edge} />
          </RadialGradient>
          <Pattern id={`linen-${uid}`} width={6} height={6} patternUnits="userSpaceOnUse">
            <Line x1={0} y1={0.5} x2={6} y2={0.5} stroke={thread} strokeWidth={0.6} />
            <Line x1={0.5} y1={0} x2={0.5} y2={6} stroke={thread} strokeWidth={0.4} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#tray-${uid})`} />
        <Rect width="100%" height="100%" fill={`url(#linen-${uid})`}
          opacity={theme.mode === 'dark' ? 0.035 : 0.05} />
      </Svg>
    </View>
  );
}
