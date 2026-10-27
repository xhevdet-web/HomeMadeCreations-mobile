import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Icon, IconButton, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { clampLength, cm, LENGTH_STEP_MM, type MeasuredSize, type Piece } from '@/helper/jewelry';

/** A size as a length range, e.g. "MEDIUM · 18 – 24 cm". */
export function SizeRangeOption({ piece, size, selected, onPress }: {
  piece: Piece;
  size: MeasuredSize;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const range = { min: cm(size.minMeasurementMm), max: cm(size.maxMeasurementMm) };
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }}
      accessibilityLabel={t(`${piece}.size.rangeLabel`, { name: size.name, ...range })}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.name}>{size.name.toUpperCase()}</Text>
        <Text style={styles.range}>{t(`${piece}.size.range`, range)}</Text>
        <Text style={styles.hint}>{t(`${piece}.size.defaultHint`, { length: cm(size.defaultMeasurementMm) })}</Text>
      </View>
      <Icon name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={26}
        color={selected ? theme.colors.accent : theme.colors.muted} />
    </Pressable>
  );
}

/**
 * The exact length within the chosen size: a big readout, a track to tap or drag,
 * and − / + for precise half-centimetre steps. Values are whole millimetres.
 */
export function LengthSelector({ piece, size, value, onChange }: {
  piece: Piece;
  size: MeasuredSize;
  value: number;
  onChange: (mm: number) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [width, setWidth] = useState(0);
  const span = size.maxMeasurementMm - size.minMeasurementMm;
  const share = (value - size.minMeasurementMm) / span;
  // A touch on the track picks the nearest half centimetre under the finger.
  const gesture = useMemo(() => {
    const pick = (x: number) => {
      if (!width) return;
      const raw = size.minMeasurementMm + (Math.min(Math.max(x, 0), width) / width) * span;
      onChange(clampLength(size, Math.round(raw / LENGTH_STEP_MM) * LENGTH_STEP_MM));
    };
    return Gesture.Pan().minDistance(0).runOnJS(true)
      .onBegin((event) => pick(event.x))
      .onUpdate((event) => pick(event.x));
  }, [width, size, span, onChange]);
  const step = (direction: 1 | -1) => onChange(clampLength(size, value + direction * LENGTH_STEP_MM));
  return (
    <View style={styles.selector}>
      <Text style={styles.eyebrow}>{t(`${piece}.size.yourLength`).toUpperCase()}</Text>
      <Text style={styles.value} accessibilityLiveRegion="polite">
        {t(`${piece}.size.lengthValue`, { length: cm(value) })}
      </Text>
      <GestureDetector gesture={gesture}>
        <View accessible accessibilityRole="adjustable"
          accessibilityLabel={t(`${piece}.size.trackLabel`,
            { length: cm(value), min: cm(size.minMeasurementMm), max: cm(size.maxMeasurementMm) })}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={styles.trackArea}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${share * 100}%` }]} />
          </View>
          <View pointerEvents="none" style={[styles.thumb, { left: share * width - 13 }]} />
        </View>
      </GestureDetector>
      <View style={styles.limits}>
        <Text style={styles.limit}>{cm(size.minMeasurementMm)} cm</Text>
        <Text style={styles.limit}>{cm(size.maxMeasurementMm)} cm</Text>
      </View>
      <View style={styles.stepper}>
        <IconButton name="remove" label={t(`${piece}.size.shorter`)} onPress={() => step(-1)}
          disabled={value <= size.minMeasurementMm} />
        <Text style={styles.stepValue}>{t(`${piece}.size.lengthValue`, { length: cm(value) })}</Text>
        <IconButton name="add" label={t(`${piece}.size.longer`)} onPress={() => step(1)}
          disabled={value >= size.maxMeasurementMm} />
      </View>
    </View>
  );
}

/** The chosen size and length, with the range it can still be adjusted within. */
export function LengthSummary({ piece, size, value }: { piece: Piece; size: MeasuredSize; value: number }) {
  const ui = useUI();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={ui.card} accessibilityLiveRegion="polite" testID="selected-size-details">
      <Text style={ui.eyebrow}>{t(`${piece}.size.selectedSize`).toUpperCase()}</Text>
      <Text style={ui.sectionTitle}>{size.name}</Text>
      <View style={styles.summaryRow}>
        <View style={{ flex: 1 }}>
          <Text style={ui.caption}>{t(`${piece}.size.selectedLength`)}</Text>
          <Text style={styles.summaryValue}>{t(`${piece}.size.lengthValue`, { length: cm(value) })}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ui.caption}>{t(`${piece}.size.availableRange`)}</Text>
          <Text style={styles.summaryValue}>
            {t(`${piece}.size.range`, { min: cm(size.minMeasurementMm), max: cm(size.maxMeasurementMm) })}
          </Text>
        </View>
      </View>
      <Text style={ui.caption}>{t(`${piece}.size.adjustHint`)}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20,
      borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
    },
    cardSelected: { borderColor: c.accent, backgroundColor: c.soft },
    name: { color: c.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
    range: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    hint: { color: c.muted, fontSize: 13 },
    selector: {
      gap: 6, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
      alignItems: 'center',
    },
    eyebrow: { color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
    value: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 36 },
    // A tall touch area around a thin track, so the thumb is easy to grab.
    trackArea: { alignSelf: 'stretch', height: 44, justifyContent: 'center' },
    track: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: 6, backgroundColor: c.accent },
    thumb: {
      position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: c.accent,
      borderWidth: 3, borderColor: c.surface,
      elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    },
    limits: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
    limit: { color: c.muted, fontSize: 12 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 4 },
    stepValue: { color: c.text, fontSize: 16, fontWeight: '600', minWidth: 64, textAlign: 'center' },
    summaryRow: { flexDirection: 'row', gap: 12, marginVertical: 6 },
    summaryValue: { color: c.text, fontSize: 17, fontWeight: '600' },
  });
};
