import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { dateLocale } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { ApiOrder, orderStages, orderStatusLabel, paymentLabel } from '@/api/commerceModels';

function orderDate(value: string, language: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(dateLocale(language), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OrderCard({ order, onPress }: { order: ApiOrder; onPress: () => void }) {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, i18n } = useTranslation();
  const current = orderStages.findIndex((stage) => stage === order.status);
  const completed = order.status === 'COMPLETED';
  const status = orderStatusLabel(t, order.status);
  const date = orderDate(order.createdAt, i18n.language);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('orders.track', { number: order.orderNumber })}
      accessibilityHint={`${order.product.name}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.top}>
        <View style={styles.thumbnail}>
          <CatalogImage
            imageUrl={order.product.designPreviewUrl ?? order.product.imageUrl}
            name={order.product.name}
            size={64}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{order.product.name}</Text>
            <View style={[styles.pill, completed && styles.pillDone]}>
              {completed && <Icon name="checkmark" size={12} color={theme.colors.success} />}
              <Text style={[styles.pillText, completed && { color: theme.colors.success }]}>
                {status}
              </Text>
            </View>
          </View>
          <Text style={ui.caption} numberOfLines={1}>
            {[order.orderNumber, date].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={styles.price}>{money(order.totalPrice)}</Text>
            <Text style={ui.caption}>{paymentLabel(t, order.paymentType)}</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
      </View>
      {current >= 0 && (
        <View
          style={styles.progress}
          accessibilityLabel={t('orders.stepOf', { step: current + 1, total: orderStages.length })}
        >
          {orderStages.map((stage, index) => (
            <View
              key={stage}
              style={[styles.segment, index <= current && styles.segmentActive]}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 18,
      padding: 14,
      gap: 12,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    thumbnail: {
      width: 72,
      height: 72,
      borderRadius: 14,
      backgroundColor: c.thumbnail,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    info: { flex: 1, gap: 3 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: c.soft,
      borderWidth: 1,
      borderColor: c.accent,
    },
    pillDone: { borderColor: c.success, backgroundColor: c.successSurface },
    pillText: { color: c.accent, fontSize: 10, fontWeight: '600' },
    bottomRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
    price: { color: c.gold, fontSize: 15, fontWeight: '600' },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.elevated },
    segmentActive: { backgroundColor: c.accent },
  });
};
