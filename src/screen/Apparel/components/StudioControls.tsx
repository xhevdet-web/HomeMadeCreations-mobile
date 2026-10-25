import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DesignSide } from '@/api/builderModels';
import { DESIGN_SIDES } from '@/api/builderModels';
import { IconButton, IconName } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
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
  });
};
