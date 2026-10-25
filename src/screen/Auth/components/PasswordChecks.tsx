import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { PASSWORD_MIN_LENGTH } from '@/helper/passwordPolicy';

function strength(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) return 0;
  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 16) score++;
  return score;
}

const labels = ['Too short', 'Fair', 'Good', 'Strong', 'Very strong'];

export function PasswordStrength({ password }: { password: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(createStyles);
  if (!password) return null;
  const score = strength(password);
  const color = score === 0 ? c.danger : score === 1 ? c.gold : c.success;
  return (
    <View style={{ gap: 6 }} accessibilityLiveRegion="polite"
      accessibilityLabel={`Password strength: ${labels[score]}`}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={[styles.bar, step <= Math.max(score, 1) && { backgroundColor: color }]} />
        ))}
      </View>
      <Text style={[styles.text, { color }]}>
        {score === 0 ? `Too short · ${PASSWORD_MIN_LENGTH - password.length} more characters` : labels[score]}
      </Text>
    </View>
  );
}

export function PasswordMatch({ password, confirm }: { password: string; confirm: string }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  if (!confirm) return null;
  const matches = password === confirm;
  const color = matches ? theme.colors.success : theme.colors.muted;
  return (
    <View style={styles.match} accessibilityLiveRegion="polite">
      <Icon name={matches ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={color} />
      <Text style={[styles.text, { color }]}>
        {matches ? 'Passwords match' : 'Passwords don’t match yet'}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.colors.elevated },
  text: { fontSize: 11, fontWeight: '500' },
  match: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
