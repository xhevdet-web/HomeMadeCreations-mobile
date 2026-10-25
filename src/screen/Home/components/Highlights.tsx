import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

// Cash on Delivery is the payment method checkout offers, so "Pay on delivery" is true.
const promises: { icon: IconName; title: string; detail: string }[] = [
  { icon: 'hand-left-outline', title: 'Handmade', detail: 'Crafted piece by piece' },
  { icon: 'cash-outline', title: 'Pay on delivery', detail: 'Nothing to pay upfront' },
  { icon: 'home-outline', title: 'To your door', detail: 'We deliver it for you' },
];

export function WhyHomeMade() {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.eyebrow}>WHY HOMEMADE?</Text>
      <View style={styles.trust}>
        {promises.map((item) => (
          <View key={item.title} style={styles.trustItem}>
            <Icon name={item.icon} size={20} color={theme.colors.accent} />
            <Text style={styles.trustTitle}>{item.title}</Text>
            <Text style={styles.trustDetail}>{item.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    trust: { flexDirection: 'row', gap: 8, padding: 16, borderRadius: 18, backgroundColor: c.soft },
    trustItem: { flex: 1, gap: 4, alignItems: 'center' },
    trustTitle: { color: c.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    trustDetail: { color: c.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  });
};
