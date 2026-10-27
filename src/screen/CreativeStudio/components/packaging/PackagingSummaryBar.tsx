import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Icon } from '@/components/common/ui';
import { choicePrice, type PackagingChoice } from '@/api/packagingModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

/** "Closed · Square · Pink" in the current language. */
export function choiceLabel(t: TFunction, choice: PackagingChoice) {
  const parts = choice.type === 'OPAQUE'
    ? [t('giftStudio.packaging.closed'),
      t(choice.shape === 'RECTANGULAR' ? 'giftStudio.packaging.rectangular' : 'giftStudio.packaging.square'),
      choice.color?.name]
    : [t('giftStudio.packaging.transparent')];
  return parts.filter(Boolean).join(' · ');
}

/**
 * The gift's packaging in one line above the studio, chosen before it opened, with a way
 * back to change it. Changing it keeps everything already placed.
 */
export function PackagingSummaryBar({ packaging, onChange }: {
  packaging: PackagingChoice | null;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const label = packaging ? choiceLabel(t, packaging) : t('giftStudio.packaging.choosePackaging');
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={packaging
        ? `${t('giftStudio.packaging.title')}: ${packaging.name}, ${label}, ${money(choicePrice(packaging))}. `
          + t('giftStudio.packaging.change')
        : label}
      onPress={onChange}
      style={({ pressed }) => [styles.bar, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.swatch, packaging?.color ? { backgroundColor: packaging.color.hex } : styles.swatchEmpty]}>
        {!packaging?.color && <Icon name="gift-outline" size={15} color={styles.icon.color} />}
      </View>
      <View style={{ flex: 1 }}>
        {packaging && <Text style={styles.name} numberOfLines={1}>{packaging.name}</Text>}
        <Text style={packaging ? styles.meta : styles.name} numberOfLines={1}>
          {packaging ? `${label} · ${money(choicePrice(packaging))}` : label}
        </Text>
      </View>
      <Text style={styles.change}>{packaging ? t('giftStudio.packaging.change') : ''}</Text>
      <Icon name="chevron-forward" size={16} color={styles.icon.color} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    bar: {
      flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    // The border keeps black and white swatches visible on either theme.
    swatch: {
      width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    swatchEmpty: { backgroundColor: c.soft },
    icon: { color: c.accent },
    name: { color: c.text, fontSize: 14, fontWeight: '600' },
    meta: { color: c.muted, fontSize: 12 },
    change: { color: c.accent, fontSize: 13, fontWeight: '700' },
  });
};
