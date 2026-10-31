import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { MAX_STICKERS_PER_DESIGN } from '@/helper/stickers';

// Bigger steps once the count is larger, so 100 stickers don't take 90 taps.
const step = (quantity: number) => (quantity >= 50 ? 10 : quantity >= 10 ? 5 : 1);

/** How many stickers of one design to print. */
export function StickerQuantitySelector({ quantity, label, onChange, min = 1, max = MAX_STICKERS_PER_DESIGN }: {
  quantity: number;
  /** Which design (or product) it is for, read by screen readers. */
  label: string;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityLabel={t('stickers.preview.quantityLabel', { design: label, count: quantity })}>
      <IconButton name="remove" label={t('stickers.preview.fewer', { design: label })} disabled={quantity <= min}
        onPress={() => onChange(Math.max(min, quantity - step(quantity - 1)))} />
      <Text style={styles.value}>{quantity}</Text>
      <IconButton name="add" label={t('stickers.preview.more', { design: label })}
        disabled={quantity >= max}
        onPress={() => onChange(Math.min(max, quantity + step(quantity)))} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { minWidth: 40, textAlign: 'center', color: theme.colors.text, fontSize: 17, fontWeight: '700' },
});
