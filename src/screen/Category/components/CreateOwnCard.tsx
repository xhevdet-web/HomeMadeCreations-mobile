import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/components/common/ui';
import type { CatalogCategory } from '@/api/catalogModels';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

// Each Creative Studio's icon; its text is category.studioText.<builderType>. Decided by
// builderType, never the category name.
const STUDIOS: Record<'JEWELRY' | 'BOUQUET' | 'GIFT' | 'APPAREL' | 'CASE', { icon: IconName }> = {
  JEWELRY: { icon: 'diamond-outline' },
  BOUQUET: { icon: 'flower-outline' },
  GIFT: { icon: 'gift-outline' },
  APPAREL: { icon: 'shirt-outline' },
  CASE: { icon: 'phone-portrait-outline' },
};

/** The prominent entry to the category's Creative Studio, shown before its products. */
export function CreateOwnCard({ category, onPress }: { category: CatalogCategory; onPress: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const builder = category.builderType ?? 'JEWELRY';
  const studio = STUDIOS[builder];
  const c = theme.colors;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('category.createOwnLabel', { name: category.name })}
      onPress={onPress} style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <View style={styles.glow} />
      <View style={styles.iconWrap}>
        <Icon name={studio.icon} size={22} color={c.onPrimary} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={styles.eyebrow}>{t('category.studioEyebrow')}</Text>
        <Text style={styles.title}>{t('category.createOwnTitle')}</Text>
        <Text style={styles.text}>{t(`category.studioText.${builder}`)}</Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{t('category.startCreating')}</Text>
        <Icon name="arrow-forward" size={16} color={c.primary} />
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      gap: 16, padding: 22, borderRadius: theme.radius.large, overflow: 'hidden',
      backgroundColor: c.primary,
      shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    // A soft highlight in the corner gives the card depth without an image.
    glow: {
      position: 'absolute', right: -60, top: -60, width: 180, height: 180, borderRadius: 90,
      backgroundColor: c.onPrimary, opacity: 0.08,
    },
    iconWrap: {
      width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.onPrimary + '55',
    },
    eyebrow: { color: c.onPrimary, opacity: 0.75, fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
    title: { color: c.onPrimary, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 31 },
    text: { color: c.onPrimary, opacity: 0.85, fontSize: 14, lineHeight: 20 },
    cta: {
      flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
      paddingVertical: 11, paddingHorizontal: 18, borderRadius: 24, backgroundColor: c.onPrimary,
    },
    ctaText: { color: c.primary, fontSize: 14, fontWeight: '700' },
  });
};
