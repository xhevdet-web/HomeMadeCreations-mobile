import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { shapeName, stickerOutline, type StickerShape } from '@/helper/stickers';

// Proportions of each shape's picture (not a real size).
const PREVIEW: Record<StickerShape, { widthMm: number; heightMm: number }> = {
  SQUARE: { widthMm: 40, heightMm: 40 },
  CIRCLE: { widthMm: 40, heightMm: 40 },
  RECTANGLE: { widthMm: 56, heightMm: 34 },
  OVAL: { widthMm: 56, heightMm: 36 },
};
const ART = 46;

/** Each offered shape as a drawn outline with its name; one is selected. */
export function StickerShapeSelector({ shapes, selected, onSelect }: {
  shapes: StickerShape[];
  selected: StickerShape | null;
  onSelect: (shape: StickerShape) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={t('stickers.setup.shapeTitle')}>
      {shapes.map((shape) => {
        const active = shape === selected;
        const proportions = PREVIEW[shape];
        const width = proportions.widthMm >= proportions.heightMm ? ART : (ART * proportions.widthMm) / proportions.heightMm;
        const outline = stickerOutline({ id: shape, name: shape, shape, price: 0, ...proportions }, width);
        return (
          <Pressable key={shape} accessibilityRole="radio" accessibilityState={{ selected: active }}
            accessibilityLabel={shapeName(t, shape)} onPress={() => onSelect(shape)}
            style={({ pressed }) => [styles.tile, active && styles.active, { opacity: pressed ? 0.8 : 1 }]}>
            <View style={styles.art}>
              <Svg width={width} height={outline.height}>
                <Path d={outline.edge} fill={active ? theme.colors.accent : theme.colors.elevated}
                  fillOpacity={active ? 0.18 : 1} stroke={active ? theme.colors.accent : theme.colors.muted}
                  strokeWidth={2} />
              </Svg>
            </View>
            <Text style={[styles.name, active && { color: theme.colors.accent }]}>{shapeName(t, shape)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: {
      flexGrow: 1, flexBasis: '45%', minHeight: 104, alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
    },
    active: { borderColor: c.accent, backgroundColor: c.soft },
    art: { height: ART, justifyContent: 'center' },
    name: { color: c.text, fontSize: 14, fontWeight: '600' },
  });
};
