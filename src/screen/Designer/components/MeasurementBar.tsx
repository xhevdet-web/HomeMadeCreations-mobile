import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { cm, isComplete, type Piece } from '@/helper/jewelry';

/**
 * The piece's length at the top of the studio, in one small line: "Bracelet length
 * 16.8 / 20 cm · 3.2 cm remaining", or "Bracelet complete" once within tolerance, with a
 * thin progress line. Updates as pieces are added or removed.
 */
export function MeasurementBar({ piece, usedMm, selectedMm, onChangeLength }: {
  piece: Piece;
  usedMm: number;
  selectedMm: number;
  onChangeLength: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const complete = isComplete(usedMm, selectedMm);
  const remaining = Math.max(selectedMm - usedMm, 0);
  const status = complete ? t(`${piece}.measurement.complete`)
    : t(`${piece}.measurement.remaining`, { remaining: cm(remaining) });
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.row}>
        <View accessible accessibilityLiveRegion="polite" style={styles.text}
          accessibilityLabel={`${t(`${piece}.measurement.usedLabel`, { used: cm(usedMm), total: cm(selectedMm) })}. ${status}`}>
          <Text style={styles.label} numberOfLines={1}>
            {t(`${piece}.measurement.length`)}{' '}
            <Text style={styles.value}>{t(`${piece}.measurement.used`, { used: cm(usedMm), total: cm(selectedMm) })}</Text>
            {' · '}
            <Text style={complete ? styles.complete : undefined}>{status}</Text>
          </Text>
          {complete && <Icon name="checkmark-circle" size={13} color={theme.colors.success} />}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t(`${piece}.measurement.changeLength`)}
          onPress={onChangeLength} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text style={styles.change}>{t(`${piece}.measurement.changeLength`)}</Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(usedMm / selectedMm, 1) * 100}%` },
          complete && { backgroundColor: theme.colors.success }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    text: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
    label: { flexShrink: 1, color: c.muted, fontSize: 12 },
    value: { color: c.text, fontWeight: '700' },
    complete: { color: c.success, fontWeight: '700' },
    change: { color: c.accent, fontSize: 12, fontWeight: '700' },
    track: { height: 3, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: 3, borderRadius: 2, backgroundColor: c.accent },
  });
};
