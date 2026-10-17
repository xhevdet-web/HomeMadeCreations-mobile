import { StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const steps = [
  { number: '01', title: 'Imagine it', detail: 'Start with an idea' },
  { number: '02', title: 'Create it', detail: 'Make it personal' },
  { number: '03', title: 'Receive it', detail: 'Delivered to you' },
];

export function HomeHero({ onCreate }: { onCreate: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.hero}>
      <View style={styles.eyebrowRow}>
        <Icon name="sparkles-outline" size={17} color={theme.colors.accent} />
        <Text style={styles.eyebrow}>IMAGINE SOMETHING YOURS</Text>
      </View>
      <Text style={styles.heroTitle}>
        Your idea.{'\n'}<Text style={styles.titleAccent}>Made real.</Text>
      </Text>
      <Text style={styles.heroBody}>
        A thoughtful gift, flowers for a special moment, or something just for you.
        Create your idea. We make it and deliver it to your door.
      </Text>
      <Button title="Create your own" icon="arrow-forward" onPress={onCreate} />
      <View style={styles.steps}>
        {steps.map(step => (
          <View key={step.number} style={styles.step}>
            <Text style={styles.stepNumber}>{step.number}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDetail}>{step.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    hero: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 24,
      gap: 22,
    },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: { flexShrink: 1, color: c.accent, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
    heroTitle: {
      fontSize: 44,
      lineHeight: 49,
      color: c.text,
      fontFamily: theme.fonts.editorial,
      letterSpacing: -1.5,
    },
    titleAccent: { color: c.accent, fontStyle: 'italic' },
    heroBody: { fontSize: 14, color: c.muted, lineHeight: 23, maxWidth: 480 },
    steps: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: c.border, paddingTop: 20 },
    step: { flex: 1, gap: 6 },
    stepNumber: { color: c.accent, fontSize: 10, letterSpacing: 1, fontWeight: '600' },
    stepTitle: { color: c.text, fontSize: 12, fontWeight: '600' },
    stepDetail: { color: c.muted, fontSize: 10, lineHeight: 16 },
  });
};
