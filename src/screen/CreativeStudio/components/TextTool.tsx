import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MAX_TEXT_LAYERS, MAX_TEXT_LENGTH, TEXT_FONTS, TEXT_WEIGHTS, type TextFont, type TextLayer, type TextWeight,
} from '@/api/builderModels';
import { Button, Field, Icon, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { FONT_LABELS, fontFamily, TEXT_COLORS, textStyle, WEIGHT_LABELS } from './TextLayer';

export type TextLook = { font: TextFont; color: string; weight: TextWeight; italic: boolean; scale: number };
// Each size step makes the text about a fifth bigger or smaller.
const SIZE_STEP = 1.2;

/**
 * The gift's personalisation tool. With a text selected it edits that text; otherwise it
 * adds a new line. Text is free: it is not a SubCategory and has no stock.
 */
export function TextTool({ selected, count, onAdd, onChange, onRemove, onDone }: {
  selected: TextLayer | null;
  count: number;
  /** `scale` is the chosen text size; the studio keeps the text inside the design. */
  onAdd: (text: string, style: TextLook) => void;
  /** `record: false` while typing; the edit is recorded when the field is left. */
  onChange: (patch: Partial<Omit<TextLayer, 'id'>>, record?: boolean) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [draft, setDraft] = useState('');
  const [font, setFont] = useState<TextFont>('SCRIPT');
  const [color, setColor] = useState(TEXT_COLORS[0].value);
  const [weight, setWeight] = useState<TextWeight>('REGULAR');
  const [italic, setItalic] = useState(false);
  const [scale, setScale] = useState(1);
  const current: TextLook = selected
    ? { font: selected.font ?? 'SERIF', color: selected.color ?? TEXT_COLORS[0].value,
      weight: selected.weight ?? 'REGULAR', italic: !!selected.italic, scale: selected.scale }
    : { font, color, weight, italic, scale };
  const full = count >= MAX_TEXT_LAYERS;

  const pickFont = (value: TextFont) => (selected ? onChange({ font: value }) : setFont(value));
  const pickColor = (value: string) => (selected ? onChange({ color: value }) : setColor(value));
  const pickWeight = (value: TextWeight) => (selected ? onChange({ weight: value }) : setWeight(value));
  const toggleItalic = () => (selected ? onChange({ italic: !current.italic }) : setItalic(!italic));
  const resize = (factor: number) => {
    const next = Math.round(current.scale * factor * 100) / 100;
    // A selected text is kept inside the design by the studio.
    if (selected) onChange({ scale: next });
    else setScale(Math.min(Math.max(next, 0.4), 2.5));
  };
  function add() {
    const text = draft.trim();
    if (!text || full) return;
    onAdd(text, { font, color, weight, italic, scale });
    setDraft('');
  }

  return (
    <View style={styles.panel}>
      {selected ? (
        <Field label="Edit your text" value={selected.text} maxLength={MAX_TEXT_LENGTH}
          onChangeText={(text) => onChange({ text }, false)}
          onBlur={() => onChange({ text: selected.text.trim() || 'Your text' })}
          placeholder="Your text" returnKeyType="done" />
      ) : (
        <Field label={`Add a message${count ? ` (${count} of ${MAX_TEXT_LAYERS})` : ''}`} value={draft}
          maxLength={MAX_TEXT_LENGTH} onChangeText={setDraft} onSubmitEditing={add}
          placeholder="Thank you · Kate & Mike · 08.06.2032" returnKeyType="done" editable={!full} />
      )}
      <View style={{ gap: 8 }}>
        <Text style={ui.label}>Style</Text>
        <View style={styles.row}>
          {TEXT_FONTS.map((value) => {
            const active = value === current.font;
            return (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={`${FONT_LABELS[value]} lettering`} onPress={() => pickFont(value)}
                style={[styles.font, active && styles.fontActive]}>
                <Text style={[styles.fontSample, { fontFamily: fontFamily(value) },
                  active && styles.fontSampleActive]}>
                  Aa
                </Text>
                <Text style={[styles.fontName, active && styles.fontSampleActive]}>{FONT_LABELS[value]}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.row}>
          {TEXT_WEIGHTS.map((value) => {
            const active = value === current.weight;
            return (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={`${WEIGHT_LABELS[value]} weight`} onPress={() => pickWeight(value)}
                style={[styles.chip, active && styles.fontActive]}>
                <Text style={[styles.chipText, textStyle({ font: current.font, weight: value }),
                  active && styles.fontSampleActive]}>
                  {WEIGHT_LABELS[value]}
                </Text>
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" accessibilityState={{ selected: current.italic }}
            accessibilityLabel="Italic" onPress={toggleItalic}
            style={[styles.chip, current.italic && styles.fontActive]}>
            <Text style={[styles.chipText, { fontStyle: 'italic' }, current.italic && styles.fontSampleActive]}>
              Italic
            </Text>
          </Pressable>
        </View>
        <View style={styles.size}>
          <Text style={ui.label}>Size</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Smaller text" onPress={() => resize(1 / SIZE_STEP)}
            style={styles.step} hitSlop={6}>
            <Text style={[styles.stepText, { fontSize: 13 }]}>A−</Text>
          </Pressable>
          <Text style={styles.sizeValue} accessibilityLabel={`Text size ${Math.round(current.scale * 100)} percent`}>
            {Math.round(current.scale * 100)}%
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Bigger text" onPress={() => resize(SIZE_STEP)}
            style={styles.step} hitSlop={6}>
            <Text style={[styles.stepText, { fontSize: 18 }]}>A+</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          {TEXT_COLORS.map((entry) => {
            const active = entry.value === current.color;
            const swatch = entry.value;
            return (
              <Pressable key={entry.value} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={`${entry.name} text`} onPress={() => pickColor(entry.value)}
                style={[styles.ring, active && { borderColor: theme.colors.accent }]}>
                {/* A `.value` read inside an inline style trips Reanimated's shared-value warning. */}
                <View style={[styles.swatch, { backgroundColor: swatch }]}>
                  {active && <Icon name="checkmark" size={13} color={entry.value === '#FFFFFF' ? '#2D3250' : '#FFFFFF'} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      {selected ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Button title="Remove" secondary onPress={onRemove} /></View>
          <View style={{ flex: 1 }}><Button title="Done" icon="checkmark" onPress={onDone} /></View>
        </View>
      ) : (
        <Button title={full ? `Up to ${MAX_TEXT_LAYERS} texts` : 'Add text'} icon="text-outline"
          disabled={!draft.trim() || full} onPress={add} />
      )}
      <Text style={ui.caption}>
        Personalised text is free. Drag it to place it; pinch, the corner handle or Size change how big it is.
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    panel: { gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    font: {
      flex: 1, minWidth: 84, alignItems: 'center', paddingVertical: 8, borderRadius: 12,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
    },
    fontActive: { backgroundColor: c.primary, borderColor: c.primary },
    fontSample: { color: c.text, fontSize: 20 },
    fontSampleActive: { color: c.onPrimary },
    fontName: { color: c.muted, fontSize: 11, fontWeight: '600' },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
    },
    chipText: { color: c.text, fontSize: 14 },
    size: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    step: {
      width: 44, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
    },
    stepText: { color: c.text, fontWeight: '700' },
    sizeValue: { color: c.text, fontSize: 14, fontWeight: '600', minWidth: 44, textAlign: 'center' },
    ring: { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
    swatch: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
    },
  });
};
