import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { choicePrice, type PackagingChoice } from '@/api/packagingModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

/** A compact receipt of the gift: contents, packaging, colour and the estimated total. */
export function GiftPriceSummary({ contents, count, packaging }: {
  /** Base product and components, in cents. */
  contents: number;
  count: string;
  packaging: PackagingChoice | null;
}) {
  const color = packaging?.color ?? null;
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const total = contents + choicePrice(packaging);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('giftStudio.packaging.summaryTitle')}</Text>
      {packaging && (
        <Text style={styles.meta} numberOfLines={2}>
          {[packaging.name, color?.name, count].filter(Boolean).join(' · ')}
        </Text>
      )}
      <View style={styles.lines}>
        <Line label={t('giftStudio.packaging.contents')} amount={contents} />
        {packaging && <Line label={t('giftStudio.packaging.packagingPrice')} amount={packaging.price} />}
        {!!color?.priceAdjustment && <Line label={t('giftStudio.packaging.colorPrice')} amount={color.priceAdjustment} />}
      </View>
      <View style={styles.divider} />
      <Line label={t('common.total')} amount={total} strong />
    </View>
  );
}

function Line({ label, amount, strong = false }: { label: string; amount: number; strong?: boolean }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.line}>
      <Text style={strong ? styles.totalLabel : styles.label}>{label}</Text>
      <Text style={strong ? styles.total : styles.amount}>{money(amount)}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: { gap: 8, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18 },
    meta: { color: c.muted, fontSize: 13 },
    lines: { gap: 6 },
    line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    label: { color: c.muted, fontSize: 14 },
    amount: { color: c.text, fontSize: 14, fontWeight: '600' },
    divider: { height: 1, backgroundColor: c.border },
    totalLabel: { color: c.text, fontSize: 15, fontWeight: '700' },
    total: { color: c.text, fontSize: 18, fontWeight: '700' },
  });
};
