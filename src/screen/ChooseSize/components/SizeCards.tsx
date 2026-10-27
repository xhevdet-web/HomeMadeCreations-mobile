import { Pressable, Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { CategorySize } from '@/types/models';
import { useTranslation } from 'react-i18next';

export function SizeOption({ size, selected, onPress }: {
  size: CategorySize;
  selected: boolean;
  onPress: () => void;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  const theme = useTheme();
  return <Pressable accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={t('jewelry.chooseSizeLabel', { name: size.name, measurement: `${size.measurement} ${size.unit}`, max: size.maxItems })}
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
    <Text style={ui.caption}>{t('jewelry.upToBeads', { max: size.maxItems })}</Text>
  </Pressable>;
}

export function SelectedSizeDetails({ size }: { size: CategorySize }) {
  const ui = useUI();
  const { t } = useTranslation();
  return <View style={ui.card} accessibilityLiveRegion="polite" testID="selected-size-details">
    <Text style={ui.eyebrow}>{t('jewelry.selectedSize')}</Text>
    <Text style={ui.sectionTitle}>{size.name}</Text>
    <Text style={ui.body}>{t('jewelry.measurement', { measurement: `${size.measurement} ${size.unit}` })}</Text>
    <Text style={ui.body}>{t('jewelry.componentLimit', { max: size.maxItems })}</Text>
    <Text style={ui.caption}>{t('jewelry.limitHint', { max: size.maxItems })}</Text>
  </View>;
}
