import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { isOrderStage, orderStages } from '@/api/commerceModels';

/** What is happening at this status, or undefined for an unknown backend value. */
export const stageDescription = (t: TFunction, status: string) =>
  isOrderStage(status) ? t(`orderStage.${status}`) : undefined;

export function OrderTimeline({ current }: { current: number }) {
  const theme = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('orderDetails.journey')}</Text>
      <View>
        {orderStages.map((stage, index) => {
          const done = index < current;
          const active = index === current;
          const last = index === orderStages.length - 1;
          const label = t(`orderStatus.${stage}`);
          return (
            <View key={stage} style={styles.row}
              accessibilityLabel={t(done ? 'orderDetails.stepDone' : active ? 'orderDetails.stepCurrent' : 'orderDetails.stepUpcoming', { status: label })}>
              <View style={styles.rail}>
                <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                  {done ? (
                    <Icon name="checkmark" size={13} color={c.onPrimary} />
                  ) : active ? (
                    <View style={styles.pulse} />
                  ) : null}
                </View>
                {!last && <View style={[styles.line, done && styles.lineDone]} />}
              </View>
              <View style={[styles.body, !last && { paddingBottom: 18 }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, (done || active) && styles.labelStrong]}>
                    {label}
                  </Text>
                  {active && (
                    <View style={styles.now}>
                      <Text style={styles.nowText}>{t('orderDetails.now')}</Text>
                    </View>
                  )}
                </View>
                {active && <Text style={styles.detail}>{t(`orderStage.${stage}`)}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: 18, padding: 16, gap: 16,
    },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 19 },
    row: { flexDirection: 'row', gap: 12 },
    rail: { alignItems: 'center', width: 26 },
    dot: {
      width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: c.border,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    },
    dotDone: { backgroundColor: c.accent, borderColor: c.accent },
    dotActive: { borderColor: c.accent, borderWidth: 2 },
    pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    line: { flex: 1, width: 2, minHeight: 14, marginVertical: 2, borderRadius: 1, backgroundColor: c.border },
    lineDone: { backgroundColor: c.accent },
    body: { flex: 1, paddingTop: 3, gap: 3 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { color: c.muted, fontSize: 13 },
    labelStrong: { color: c.text, fontWeight: '600' },
    now: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: c.soft },
    nowText: { color: c.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    detail: { color: c.muted, fontSize: 12, lineHeight: 18 },
  });
};
