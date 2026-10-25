import { StyleSheet, Text, View } from 'react-native';
import { componentCount } from '@/helper/builders';
import { Icon, IconName } from '@/components/common/ui';
import { Disclosure } from '@/components/common/Disclosure';
import { DetailRow } from '@/components/checkout/ProductOverview';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { ApiOrder, orderStages, orderStatusLabel, paymentLabel } from '@/api/commerceModels';
import { CategorySize } from '@/types/models';
import { OrderTimeline, stageDescriptions } from './OrderTimeline';
import { ApparelSummary } from '@/components/apparel/ApparelSummary';
import { apparelMeta, isApparelProduct } from '@/services/apparelDesign';

function orderDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

// ProductItems store consecutive runs; show one line per bead type.
function beadLines(order: ApiOrder) {
  const lines = new Map<string, { name: string; quantity: number; unitPrice: number }>();
  for (const item of order.product.items ?? []) {
    const key = item.subCategoryId + ':' + item.unitPrice;
    const line = lines.get(key);
    if (line) line.quantity += item.quantity;
    else lines.set(key, { name: item.subCategory.name, quantity: item.quantity, unitPrice: item.unitPrice });
  }
  return [...lines.values()];
}

function InfoRow({ icon, text, strong = false }: { icon: IconName; text: string; strong?: boolean }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={16} color={theme.colors.muted} />
      <Text style={[styles.infoText, strong && styles.infoStrong]}>{text}</Text>
    </View>
  );
}

export function OrderTracking({ order }: { order: ApiOrder }) {
  const theme = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(createStyles);
  const current = orderStages.findIndex((stage) => stage === order.status);
  const status = orderStatusLabel(order.status);
  const completed = order.status === 'COMPLETED';
  const paid = order.paymentStatus === 'PAID';
  const cashOnDelivery = order.paymentType === 'CASH_ON_DELIVERY';
  const size = (order.product as { selectedSize?: CategorySize | null }).selectedSize;
  const readyMade = order.product.origin === 'COMPANY';
  const apparel = !readyMade && isApparelProduct(order.product);
  const lines = readyMade || apparel ? [] : beadLines(order);
  const date = orderDate(order.createdAt);
  const address = [order.address, [order.postalCode, order.country].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ');

  return (
    <>
      <View style={styles.card}>
        <View style={styles.heroTop}>
          <View style={styles.thumbnail}>
            <CatalogImage imageUrl={order.product.designPreviewUrl ?? order.product.imageUrl}
              name={order.product.name} size={84} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name} numberOfLines={2}>{order.product.name}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {readyMade
                ? 'Ready-made jewelry'
                : apparel
                  ? apparelMeta(order.product).join(' · ')
                  : [componentCount(order.product.itemCount, order.product.category?.builderType),
                    size && `${size.name} · ${size.measurement} ${size.unit}`]
                    .filter(Boolean).join(' · ')}
            </Text>
            <View style={[styles.pill, completed && styles.pillDone]}>
              {completed && <Icon name="checkmark" size={12} color={c.success} />}
              <Text style={[styles.pillText, completed && { color: c.success }]}>{status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusBox}>
          <Text style={styles.headline}>{stageDescriptions[order.status] ?? 'We’re taking care of your order.'}</Text>
          {current >= 0 && (
            <View style={styles.progress}>
              {orderStages.map((stage, index) => (
                <View key={stage} style={[styles.segment, index <= current && styles.segmentActive]} />
              ))}
            </View>
          )}
          <View style={styles.between}>
            <Text style={styles.meta}>Status: {status}</Text>
            {current >= 0 && (
              <Text style={styles.meta}>Step {current + 1} of {orderStages.length}</Text>
            )}
          </View>
        </View>
        <Text style={styles.meta}>
          Order {order.orderNumber}{date ? ` · Placed ${date}` : ''}
        </Text>
      </View>

      <OrderTimeline current={current} />

      {apparel && <ApparelSummary product={order.product} />}

      <View style={styles.card}>
        <Text style={styles.title}>Delivery</Text>
        <InfoRow icon="person-outline" text={`${order.firstName} ${order.lastName}`.trim()} strong />
        {!!address && <InfoRow icon="location-outline" text={address} />}
        {!!order.phone && <InfoRow icon="call-outline" text={order.phone} />}
      </View>

      <View style={styles.card}>
        <View style={styles.between}>
          <Text style={styles.title}>Payment</Text>
          <View style={[styles.pill, paid && styles.pillDone]}>
            <Text style={[styles.pillText, paid && { color: c.success }]}>
              {paid ? 'Paid' : cashOnDelivery ? 'Due on delivery' : 'Unpaid'}
            </Text>
          </View>
        </View>
        <View style={styles.between}>
          <Text style={styles.meta}>
            {paymentLabel(order.paymentType)}
            {!paid && cashOnDelivery ? ' · Pay when your order arrives' : ''}
          </Text>
          <Text style={styles.total}>{money(order.totalPrice)}</Text>
        </View>
      </View>

      {!!order.customerNotes && (
        <View style={styles.card}>
          <Text style={styles.title}>Your note</Text>
          <Text style={styles.infoText}>{order.customerNotes}</Text>
        </View>
      )}

      {lines.length > 0 && (
        <Disclosure title={order.product.category?.builderType && order.product.category.builderType !== 'JEWELRY'
          ? 'Price details' : 'Beads & price details'}
          summary={`${componentCount(order.product.itemCount, order.product.category?.builderType)} · ${money(order.totalPrice)}`}>
          {lines.map((line) => (
            <DetailRow
              key={line.name + line.unitPrice}
              label={line.quantity + ' × ' + line.name}
              value={money(line.quantity * line.unitPrice)}
            />
          ))}
          <View style={styles.divider} />
          <DetailRow label="Total" value={money(order.totalPrice)} />
        </Disclosure>
      )}
    </>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: 18, padding: 16, gap: 12,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    thumbnail: {
      width: 92, height: 92, borderRadius: 16, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 22, lineHeight: 27 },
    meta: { color: c.muted, fontSize: 12 },
    pill: {
      alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
      backgroundColor: c.soft, borderWidth: 1, borderColor: c.accent,
    },
    pillDone: { borderColor: c.success, backgroundColor: c.successSurface },
    pillText: { color: c.accent, fontSize: 11, fontWeight: '600' },
    statusBox: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: c.soft },
    headline: { color: c.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.elevated },
    segmentActive: { backgroundColor: c.accent },
    between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 19 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoText: { flex: 1, color: c.muted, fontSize: 13, lineHeight: 19 },
    infoStrong: { color: c.text, fontWeight: '600' },
    total: { color: c.text, fontSize: 22, fontWeight: '600' },
    divider: { height: 1, backgroundColor: c.border },
  });
};
