import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

/** Where this screen sits in the flow (step 1 of 3), plus how many categories are shown. */
export function CreateIntro({ count }: { count: number }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const steps = [t('categories.stepCategory'), t('categories.stepExplore'), t('categories.stepCreate')];
  return (
    <View style={{ gap: 12, marginBottom: 4 }}>
      <View style={styles.steps} accessibilityLabel={t('categories.stepLabel')}>
        {steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, index === 0 && styles.dotActive]}>
              <Text style={[styles.dotText, index === 0 && styles.dotTextActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepText, index === 0 && styles.stepTextActive]}>{step}</Text>
            {index < steps.length - 1 && <View style={styles.connector} />}
          </View>
        ))}
      </View>
      {count > 0 && <Text style={styles.count}>{t('categories.count', { count })}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    steps: { flexDirection: 'row', alignItems: 'center' },
    step: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    dot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotActive: { backgroundColor: c.primary, borderColor: c.primary },
    dotText: { color: c.muted, fontSize: 10, fontWeight: '600' },
    dotTextActive: { color: c.onPrimary },
    stepText: { color: c.muted, fontSize: 11 },
    stepTextActive: { color: c.text, fontWeight: '600' },
    connector: { flex: 1, height: 1, backgroundColor: c.border, marginHorizontal: 4 },
    count: { color: c.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  });
};
