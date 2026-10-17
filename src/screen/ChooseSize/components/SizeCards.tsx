import { Pressable, Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { CategorySize } from '@/types/models';

export function SizeOption({ size, selected, onPress }: {
  size: CategorySize;
  selected: boolean;
  onPress: () => void;
}) {
  const ui = useUI();
  const theme = useTheme();
  return <Pressable accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={`Choose ${size.name}, ${size.measurement} ${size.unit}, up to ${size.maxItems} beads`}
    onPress={onPress}
    style={({ pressed }) => [ui.card, {
      opacity: pressed ? 0.7 : 1,
      borderColor: selected ? theme.colors.accent : theme.colors.border,
      backgroundColor: selected ? theme.colors.soft : theme.colors.surface,
    }]}>
    <View style={ui.between}>
      <Text style={ui.sectionTitle}>{size.name}</Text>
      <Icon name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        color={selected ? theme.colors.accent : theme.colors.muted} />
    </View>
    <Text style={ui.label}>{size.measurement} {size.unit}</Text>
    <Text style={ui.caption}>Up to {size.maxItems} beads</Text>
  </Pressable>;
}

export function SelectedSizeDetails({ size }: { size: CategorySize }) {
  const ui = useUI();
  return <View style={ui.card} accessibilityLiveRegion="polite" testID="selected-size-details">
    <Text style={ui.eyebrow}>YOUR SELECTED SIZE</Text>
    <Text style={ui.sectionTitle}>{size.name}</Text>
    <Text style={ui.body}>Measurement: {size.measurement} {size.unit}</Text>
    <Text style={ui.body}>Component limit: {size.maxItems}</Text>
    <Text style={ui.caption}>You can place up to {size.maxItems} components. Once full, you can still rearrange, replace, or remove them.</Text>
  </View>;
}
