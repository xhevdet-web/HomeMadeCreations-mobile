import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

// Cash on Delivery is the payment method checkout offers, so "Pay on delivery" is true.
const promises = [
  { icon: 'hand-left-outline', title: 'home.whyHandmade', detail: 'home.whyHandmadeDetail' },
  { icon: 'cash-outline', title: 'home.whyPayOnDelivery', detail: 'home.whyPayOnDeliveryDetail' },
  { icon: 'home-outline', title: 'home.whyToYourDoor', detail: 'home.whyToYourDoorDetail' },
] as const satisfies readonly { icon: IconName; title: string; detail: string }[];

export function WhyHomeMade() {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.eyebrow}>{t('home.whyEyebrow')}</Text>
      <View style={styles.trust}>
        {promises.map((item) => (
          <View key={item.title} style={styles.trustItem}>
            <Icon name={item.icon} size={20} color={theme.colors.accent} />
            <Text style={styles.trustTitle}>{t(item.title)}</Text>
            <Text style={styles.trustDetail}>{t(item.detail)}</Text>
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
