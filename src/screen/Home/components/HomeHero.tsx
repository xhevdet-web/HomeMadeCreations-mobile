import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

/** The strongest call to action on Home; kept compact so discovery follows quickly. */
export function HomeHero({ onCreate }: { onCreate: () => void }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle} accessibilityRole="header">
        {t('home.heroTitle')} <Text style={styles.titleAccent}>{t('home.heroTitleAccent')}</Text>
      </Text>
      <Text style={styles.heroBody}>{t('home.heroBody')}</Text>
      <Button title={t('home.createYourOwn')} icon="arrow-forward" onPress={onCreate} />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    hero: {
      backgroundColor: c.surface, borderRadius: 24, borderWidth: 1, borderColor: c.border,
      padding: 22, gap: 16,
    },
    heroTitle: {
      fontSize: 24, lineHeight: 30, color: c.text, fontFamily: theme.fonts.editorial, letterSpacing: -0.5,
    },
    titleAccent: { color: c.accent, fontStyle: 'italic' },
    heroBody: { fontSize: 14, color: c.muted, lineHeight: 22, maxWidth: 480 },
  });
};
