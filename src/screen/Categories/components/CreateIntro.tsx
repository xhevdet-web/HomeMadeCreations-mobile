import { StyleSheet, Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const steps = ['Category', 'Explore', 'Create'];

export function CreateIntro() {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14, marginBottom: 6 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>What would you like to create?</Text>
        <Text style={ui.body}>Pick a category to explore its pieces, or create your own design.</Text>
      </View>
      <View style={styles.steps} accessibilityLabel="Step 1 of 3: choose a category">
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
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 32 },
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
  });
};
