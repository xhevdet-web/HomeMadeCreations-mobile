import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { ApiOrder, orderStages, orderStatusLabel } from '@/api/commerceModels';

function ContinueCard({ icon, eyebrow, title, detail, label, progress, onPress }: {
  icon: IconName;
  eyebrow: string;
  title: string;
  detail: string;
  label: string;
  progress?: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={theme.colors.onPrimary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
      </View>
      {progress !== undefined && (
        <View style={styles.progress}>
          {orderStages.map((stage, index) => (
            <View key={stage} style={[styles.segment, index <= progress && styles.segmentActive]} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

export function ActiveOrderCard({ order, onPress }: { order: ApiOrder; onPress: () => void }) {
  const status = orderStatusLabel(order.status);
  return (
    <ContinueCard
      icon="cube-outline"
      eyebrow={`ORDER · ${status.toUpperCase()}`}
      title={order.product.name}
      detail={`${order.orderNumber} · ${money(order.totalPrice)}`}
      label={`Track your order ${order.orderNumber}, ${status}`}
      progress={orderStages.findIndex((stage) => stage === order.status)}
      onPress={onPress}
    />
  );
}

export function DraftCard({ name, beads, total, onPress }: {
  name: string;
  beads: number;
  total: number;
  onPress: () => void;
}) {
  return (
    <ContinueCard
      icon="color-palette-outline"
      eyebrow="UNSAVED DESIGN"
      title={name}
      detail={`${beads} ${beads === 1 ? 'bead' : 'beads'} · ${money(total)}`}
      label="Continue your design"
      onPress={onPress}
    />
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    icon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyebrow: { color: c.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 17 },
    detail: { color: c.muted, fontSize: 12 },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.elevated },
    segmentActive: { backgroundColor: c.accent },
  });
};
