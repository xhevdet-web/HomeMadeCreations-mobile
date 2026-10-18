import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_TEXT_LAYERS, MAX_TEXT_LENGTH, TEXT_FONTS, type TextFont, type TextLayer } from '@/api/builderModels';
import { Button, Field, Icon, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { FONT_LABELS, fontFamily, TEXT_COLORS } from './TextLayer';

/**
 * The gift's personalisation tool. With a text selected it edits that text; otherwise it
 * adds a new line. Text is free: it is not a SubCategory and has no stock.
 */
export function TextTool({ selected, count, onAdd, onChange, onRemove, onDone }: {
  selected: TextLayer | null;
  count: number;
  onAdd: (text: string, style: { font: TextFont; color: string }) => void;
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
  const currentFont = selected?.font ?? font;
  const currentColor = selected?.color ?? color;
  const full = count >= MAX_TEXT_LAYERS;

  const pickFont = (value: TextFont) => (selected ? onChange({ font: value }) : setFont(value));
  const pickColor = (value: string) => (selected ? onChange({ color: value }) : setColor(value));
  function add() {
    const text = draft.trim();
    if (!text || full) return;
    onAdd(text, { font, color });
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
            const active = value === currentFont;
            return (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={`${FONT_LABELS[value]} lettering`} onPress={() => pickFont(value)}
                style={[styles.font, active && styles.fontActive]}>
                <Text style={[styles.fontSample, { fontFamily: fontFamily(value) }, active && styles.fontSampleActive]}>
                  Aa
                </Text>
                <Text style={[styles.fontName, active && styles.fontSampleActive]}>{FONT_LABELS[value]}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.row}>
          {TEXT_COLORS.map((entry) => {
            const active = entry.value === currentColor;
            return (
              <Pressable key={entry.value} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={`${entry.name} text`} onPress={() => pickColor(entry.value)}
                style={[styles.ring, active && { borderColor: theme.colors.accent }]}>
                <View style={[styles.swatch, { backgroundColor: entry.value }]}>
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
        Personalised text is free. Drag it on the bag to place it; pinch or use the corner handle to resize.
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
    ring: { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
    swatch: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
    },
  });
};
