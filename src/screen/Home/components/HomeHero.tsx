import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

/** The strongest call to action on Home; kept compact so discovery follows quickly. */
export function HomeHero({ onCreate }: { onCreate: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <View style={styles.eyebrowRow}>
        <Icon name="sparkles-outline" size={16} color={theme.colors.accent} />
        <Text style={styles.eyebrow}>{t('home.heroEyebrow')}</Text>
      </View>
      <Text style={styles.heroTitle}>
        {t('home.heroTitle')}{'\n'}<Text style={styles.titleAccent}>{t('home.heroTitleAccent')}</Text>
      </Text>
      <Text style={styles.heroBody}>
        {t('home.heroBody')}
      </Text>
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
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: { flexShrink: 1, color: c.accent, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
    heroTitle: {
      fontSize: 38, lineHeight: 43, color: c.text, fontFamily: theme.fonts.editorial, letterSpacing: -1.2,
    },
    titleAccent: { color: c.accent, fontStyle: 'italic' },
    heroBody: { fontSize: 14, color: c.muted, lineHeight: 22, maxWidth: 480 },
  });
};
