import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

/** − n + for how many of a product to order, between `min` and `max`. */
export function QuantityStepper({ quantity, min, max, label, onChange }: {
  quantity: number;
  min: number;
  max: number;
  /** What is counted, read by screen readers, e.g. the product name. */
  label: string;
  onChange: (quantity: number) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityLabel={t('quantity.label', { name: label, count: quantity })}>
      <IconButton name="remove" label={t('quantity.fewer', { name: label })} disabled={quantity <= min}
        onPress={() => onChange(Math.max(min, quantity - 1))} />
      <Text style={styles.value}>{quantity}</Text>
      <IconButton name="add" label={t('quantity.more', { name: label })} disabled={quantity >= max}
        onPress={() => onChange(Math.min(max, quantity + 1))} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { minWidth: 36, textAlign: 'center', color: theme.colors.text, fontSize: 17, fontWeight: '700' },
});
