import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { CustomizationItem } from '@/types/models';
import { useTheme } from '@/hooks/useTheme';

export function BeadShape({
  item,
  x = 24,
  y = 24,
  radius = 18,
  id,
  selected = false,
  onPress,
}: {
  item: CustomizationItem;
  x?: number;
  y?: number;
  radius?: number;
  id: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const metallic = item.material === 'Metal';
  const theme = useTheme();
  return (
    <G onPress={onPress}>
      <Defs>
        <RadialGradient id={id} cx="32%" cy="24%" r="80%">
          <Stop
            offset="0"
            stopColor={metallic ? '#FFF3D5' : '#FFFFFF'}
            stopOpacity={metallic ? 0.95 : 0.78}
          />
          <Stop offset="0.23" stopColor={item.hex} />
          <Stop offset="0.66" stopColor={item.hex} />
          <Stop offset="1" stopColor="#080908" />
        </RadialGradient>
      </Defs>
      {selected && (
        <Circle
          cx={x}
          cy={y}
          r={radius + 6}
          stroke={theme.colors.accent}
          strokeWidth={2}
          fill="none"
        />
      )}
      <Ellipse
        cx={x + 2}
        cy={y + radius * 0.7}
        rx={radius * 1.05}
        ry={radius * 0.6}
        fill="#000"
        opacity={0.4}
      />
      <Circle cx={x} cy={y} r={radius} fill={`url(#${id})`} stroke={item.hex} strokeWidth={0.6} />
      {item.shape === 'Faceted' && (
        <Path
          d={`M${x},${y - radius} L${x + radius * 0.75},${y - radius * 0.25} L${x + radius * 0.6},${y + radius * 0.65} L${x - radius * 0.5},${y + radius * 0.5} L${x - radius * 0.75},${y - radius * 0.35} Z`}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.22}
          strokeWidth={1}
        />
      )}
      {item.material === 'Stone' && (
        <Path
          d={`M${x - radius * 0.8},${y + radius * 0.3} Q${x},${y - radius * 0.7} ${x + radius * 0.8},${y - radius * 0.2} M${x - radius * 0.4},${y + radius * 0.8} Q${x + radius * 0.3},${y} ${x + radius * 0.8},${y + radius * 0.3}`}
          stroke="#DBBB7D"
          strokeOpacity={0.3}
          fill="none"
          strokeWidth={1.4}
        />
      )}
      {!item.symbol && (
        <>
          <Ellipse
            cx={x - radius * 0.3}
            cy={y - radius * 0.5}
            rx={radius * 0.29}
            ry={radius * 0.14}
            fill="#FFFFFF"
            opacity={0.6}
            transform={`rotate(-30 ${x - radius * 0.3} ${y - radius * 0.5})`}
          />
          <Circle
            cx={x + radius * 0.4}
            cy={y + radius * 0.5}
            r={radius * 0.1}
            fill="#FFFFFF"
            opacity={0.2}
          />
        </>
      )}
      {item.symbol && (
        <SvgText
          x={x}
          y={y + radius * 0.35}
          textAnchor="middle"
          fontSize={radius * 1.15}
          fontFamily="serif"
          fill="#594021"
        >
          {item.symbol}
        </SvgText>
      )}
      {onPress && <Circle cx={x} cy={y} r={Math.max(22, radius)} fill="transparent" />}
    </G>
  );
}
export function DesignItem({ item, size = 48 }: { item: CustomizationItem; size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <BeadShape item={item} id={`bead-${id}`} />
    </Svg>
  );
}
