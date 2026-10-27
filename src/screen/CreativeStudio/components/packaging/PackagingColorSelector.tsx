import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/common/ui';
import { colorAvailable, type GiftPackagingColor } from '@/api/packagingModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { luminance } from './PackagingArt';

/**
 * The colours of the chosen closed packaging. Every swatch keeps its real colour and is
 * always named, so the choice never depends on colour alone; a selected swatch gets a ring
 * and a check, and sold-out colours stay visible but disabled.
 */
export function PackagingColorSelector({ colors, selectedId, onSelect }: {
  colors: GiftPackagingColor[];
  selectedId: string | null;
  onSelect: (color: GiftPackagingColor) => void;
}) {
  const { t } = useTranslation();
  const ui = useThemedStyles(createStyles);
  // Inactive colours are hidden, except the one a saved gift still has.
  const visible = colors.filter((color) => color.isActive || color.id === selectedId);
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ gap: 10 }}>
      {/* The step around it carries the title ("Box color"). */}
      <Text style={ui.subtitle}>{t('giftStudio.packaging.chooseColorSubtitle')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.row}
        accessibilityRole="radiogroup">
        {visible.map((color) => {
          const available = colorAvailable(color);
          const selected = color.id === selectedId;
          const status = !color.isActive ? t('giftStudio.packaging.unavailable')
            : !available ? t('giftStudio.packaging.outOfStock')
              : color.priceAdjustment ? '+' + money(color.priceAdjustment) : null;
          return (
            <Pressable key={color.id} accessibilityRole="radio"
              accessibilityState={{ selected, disabled: !available }}
              accessibilityLabel={[t('giftStudio.packaging.colorLabel', { name: color.name }), status]
                .filter(Boolean).join(', ')}
              disabled={!available}
              onPress={() => onSelect(color)}
              style={({ pressed }) => [ui.option, { opacity: !available ? 0.45 : pressed ? 0.75 : 1 }]}>
              <View style={[ui.ring, selected && ui.ringSelected]}>
                <View style={[ui.swatch, { backgroundColor: color.hex }]}>
                  {selected && (
                    <Icon name="checkmark" size={18} color={luminance(color.hex) > 0.5 ? '#2D3250' : '#FFFFFF'} />
                  )}
                  {!available && <View style={ui.strike} />}
                </View>
              </View>
              <Text style={[ui.name, selected && ui.nameSelected]} numberOfLines={1}>{color.name}</Text>
              {status && <Text style={[ui.status, !available && ui.statusOut]} numberOfLines={1}>{status}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    subtitle: { color: c.muted, fontSize: 13 },
    row: { gap: 6, paddingVertical: 2 },
    option: { width: 76, minHeight: 88, alignItems: 'center', gap: 4 },
    ring: {
      width: 52, height: 52, borderRadius: 26, padding: 3, borderWidth: 2, borderColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
    },
    ringSelected: { borderColor: c.accent },
    swatch: {
      // The border keeps black and white swatches visible on either theme.
      width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    strike: { position: 'absolute', width: 54, height: 2, backgroundColor: c.muted, transform: [{ rotate: '-45deg' }] },
    name: { color: c.text, fontSize: 13, fontWeight: '500' },
    nameSelected: { fontWeight: '700' },
    status: { color: c.muted, fontSize: 11 },
    statusOut: { color: c.danger },
  });
};
