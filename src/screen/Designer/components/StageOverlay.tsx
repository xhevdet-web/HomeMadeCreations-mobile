import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconButton } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

export function StageOverlay({ label, counter, full, progress, onUndo, onRedo, canUndo, canRedo,
  onClear, canClear }: {
  label: string;
  counter: string;
  full: boolean;
  /** 0–1 share of the size's capacity; omitted when the category has no sizes. */
  progress?: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  canClear: boolean;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <>
      <View pointerEvents="none" style={styles.topRow}>
        <Text style={styles.chip} numberOfLines={1}>{label}</Text>
        <View style={[styles.counter, full && styles.counterFull]}>
          {full && <Icon name="checkmark-circle" size={12} color={theme.colors.onPrimary} />}
          <Text style={[styles.counterText, full && { color: theme.colors.onPrimary }]}>
            {counter}
          </Text>
        </View>
      </View>
      <View style={styles.bottomRow} pointerEvents="box-none">
        <IconButton name="trash-outline" label="Clear design" onPress={onClear}
          disabled={!canClear} />
        <View style={styles.history}>
          <IconButton name="arrow-undo-outline" label="Undo" onPress={onUndo}
            disabled={!canUndo} />
          <IconButton name="arrow-redo-outline" label="Redo" onPress={onRedo}
            disabled={!canRedo} />
        </View>
      </View>
      {progress !== undefined && (
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} />
        </View>
      )}
    </>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    topRow: {
      position: 'absolute', top: 12, left: 12, right: 12,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    },
    chip: {
      flexShrink: 1,
      fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
      color: c.text, backgroundColor: c.badge, overflow: 'hidden',
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    },
    counter: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.badge,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 20,
    },
    counterFull: { backgroundColor: c.primary },
    counterText: { fontSize: 10, letterSpacing: 0.6, fontWeight: '600', color: c.text },
    bottomRow: {
      position: 'absolute', left: 12, right: 12, bottom: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    history: { flexDirection: 'row', gap: 8 },
    track: {
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 3,
      backgroundColor: c.border,
    },
    fill: { height: 3, backgroundColor: c.accent },
  });
};
