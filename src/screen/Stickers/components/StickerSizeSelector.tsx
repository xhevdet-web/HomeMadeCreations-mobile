import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { stickerDimensions, type StickerSize } from '@/helper/stickers';

/** The sizes offered for the chosen shape, each with its price per sticker. */
export function StickerSizeSelector({ sizes, selectedId, onSelect }: {
  sizes: StickerSize[];
  selectedId: string | null;
  onSelect: (size: StickerSize) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={t('stickers.setup.sizeTitle')}>
      {sizes.map((size) => {
        const active = size.id === selectedId;
        const dimensions = stickerDimensions(t, size);
        const price = t('stickers.perSticker', { price: money(size.price) });
        return (
          <Pressable key={size.id} accessibilityRole="radio" accessibilityState={{ selected: active }}
            accessibilityLabel={`${dimensions}, ${price}`} onPress={() => onSelect(size)}
            style={({ pressed }) => [styles.option, active && styles.active, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[styles.size, active && styles.activeText]}>{dimensions}</Text>
            <Text style={[styles.price, active && styles.activeText]}>{price}</Text>
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
    option: {
      minWidth: 104, flexGrow: 1, flexBasis: '28%', gap: 2, paddingVertical: 12, paddingHorizontal: 14,
      borderRadius: 16, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center',
    },
    active: { borderColor: c.primary, backgroundColor: c.primary },
    size: { color: c.text, fontSize: 15, fontWeight: '700' },
    price: { color: c.muted, fontSize: 12 },
    activeText: { color: c.onPrimary },
  });
};
