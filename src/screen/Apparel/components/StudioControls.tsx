import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CategoryOption, DesignSide, SelectedOptions } from '@/api/builderModels';
import { DESIGN_SIDES } from '@/api/builderModels';
import { Field, Icon, IconButton, IconName } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

export function SideSwitch({ side, counts, onChange }: {
  side: DesignSide;
  counts: Record<DesignSide, number>;
  onChange: (side: DesignSide) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {DESIGN_SIDES.map((value) => {
        const active = value === side;
        return (
          <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: active }}
            accessibilityLabel={`${value === 'FRONT' ? 'Front' : 'Back'}, ${counts[value]} designs`}
            onPress={() => onChange(value)} style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {value === 'FRONT' ? 'Front' : 'Back'}
            </Text>
            {counts[value] > 0 && (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{counts[value]}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function ToolButton({ icon, label, onPress, disabled }: {
  icon: IconName; label: string; onPress: () => void; disabled?: boolean;
}) {
  return <IconButton name={icon} label={label} onPress={onPress} disabled={disabled} />;
}

export function DesignToolbar({ name, onSmaller, onLarger, onRotateLeft, onRotateRight, onCenter,
  onRemove, onDone }: {
  name: string;
  onSmaller: () => void;
  onLarger: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onCenter: () => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.toolbar}>
      <Text style={styles.toolbarName} numberOfLines={1}>{name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tools}>
        <ToolButton icon="remove" label={`Make ${name} smaller`} onPress={onSmaller} />
        <ToolButton icon="add" label={`Make ${name} larger`} onPress={onLarger} />
        <ToolButton icon="refresh-outline" label={`Rotate ${name} left`} onPress={onRotateLeft} />
        <ToolButton icon="reload-outline" label={`Rotate ${name} right`} onPress={onRotateRight} />
        <ToolButton icon="locate-outline" label={`Centre ${name}`} onPress={onCenter} />
        <ToolButton icon="trash-outline" label={`Remove ${name}`} onPress={onRemove} />
        <ToolButton icon="checkmark" label="Done editing" onPress={onDone} />
      </ScrollView>
    </View>
  );
}

/** Renders every category option dynamically: chips, swatches, a stepper or a field. */
export function OptionControls({ options, values, onChange }: {
  options: CategoryOption[];
  values: SelectedOptions;
  onChange: (key: string, value: string | number | undefined) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 18 }}>
      {options.map((option) => {
        const value = values[option.key];
        const label = option.type === 'color'
          ? option.values.find((color) => color.value === value)?.name : value;
        return (
          <View key={option.key} style={{ gap: 10 }}>
            <View style={styles.optionHead}>
              <Text style={styles.optionName}>
                {option.name}{option.required ? '' : ' (optional)'}
              </Text>
              {label !== undefined && <Text style={styles.optionValue}>{String(label)}</Text>}
            </View>
            {option.type === 'select' && (
              <View style={styles.wrap}>
                {option.values.map((choice) => {
                  const active = choice === value;
                  return (
                    <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: active }}
                      accessibilityLabel={`${option.name} ${choice}`}
                      onPress={() => onChange(option.key, choice)}
                      style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{choice}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {option.type === 'color' && (
              <View style={styles.wrap}>
                {option.values.map((color) => {
                  const active = color.value === value;
                  return (
                    <Pressable key={color.value} accessibilityRole="button" accessibilityState={{ selected: active }}
                      accessibilityLabel={`${option.name} ${color.name}`}
                      onPress={() => onChange(option.key, color.value)}
                      style={[styles.swatchRing, active && { borderColor: theme.colors.accent }]}>
                      <View style={[styles.swatch, { backgroundColor: color.value }]}>
                        {active && <Icon name="checkmark" size={14}
                          color={/^#?(f|e|d)/i.test(color.value) ? '#2D3250' : '#FFFFFF'} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {option.type === 'number' && (
              <View style={styles.stepper}>
                <IconButton name="remove" label={`Decrease ${option.name}`}
                  disabled={typeof value === 'number' && option.min !== undefined && value <= option.min}
                  onPress={() => onChange(option.key, Math.max(option.min ?? -Infinity,
                    (typeof value === 'number' ? value : option.min ?? 0) - 1))} />
                <Text style={styles.optionName}>{typeof value === 'number' ? value : '—'}</Text>
                <IconButton name="add" label={`Increase ${option.name}`}
                  disabled={typeof value === 'number' && option.max !== undefined && value >= option.max}
                  onPress={() => onChange(option.key, Math.min(option.max ?? Infinity,
                    (typeof value === 'number' ? value : (option.min ?? 0) - 1) + 1))} />
              </View>
            )}
            {option.type === 'text' && (
              <Field label={option.name} value={typeof value === 'string' ? value : ''}
                onChangeText={(text) => onChange(option.key, text)} maxLength={option.maxLength} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** First required option without a value, if any. */
export function missingOption(options: CategoryOption[], values: SelectedOptions) {
  return options.find((option) => option.required &&
    (values[option.key] === undefined || values[option.key] === ''));
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    switch: {
      flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14,
      backgroundColor: c.soft, alignSelf: 'center',
    },
    segment: {
      flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 104, justifyContent: 'center',
      paddingVertical: 9, paddingHorizontal: 16, borderRadius: 11,
    },
    segmentActive: { backgroundColor: c.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    segmentText: { color: c.muted, fontSize: 13, fontWeight: '600' },
    segmentTextActive: { color: c.text },
    badge: { minWidth: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: c.border, alignItems: 'center' },
    badgeActive: { backgroundColor: c.primary },
    badgeText: { color: c.muted, fontSize: 10, fontWeight: '700' },
    badgeTextActive: { color: c.onPrimary },
    toolbar: {
      gap: 6, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: c.accent,
      backgroundColor: c.surface,
    },
    toolbarName: { color: c.text, fontSize: 13, fontWeight: '600' },
    tools: { gap: 6 },
    optionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionName: { color: c.text, fontSize: 14, fontWeight: '600' },
    optionValue: { color: c.accent, fontSize: 13, fontWeight: '600' },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      minWidth: 52, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.text, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: c.onPrimary },
    swatchRing: { padding: 3, borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
    swatch: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
    },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  });
};
