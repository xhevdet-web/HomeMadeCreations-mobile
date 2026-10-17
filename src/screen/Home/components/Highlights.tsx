import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const promises: { icon: IconName; title: string; detail: string }[] = [
  { icon: 'hand-left-outline', title: 'Handmade', detail: 'Crafted piece by piece' },
  { icon: 'cash-outline', title: 'Pay on delivery', detail: 'Nothing to pay upfront' },
  { icon: 'home-outline', title: 'To your door', detail: 'We deliver it for you' },
];

// Static teasers until these products exist in the catalog.
const upcoming: { icon: IconName; title: string; detail: string }[] = [
  { icon: 'gift-outline', title: 'Gift wrapping', detail: 'Ready-to-give packaging with a note' },
  { icon: 'text-outline', title: 'Letter charms', detail: 'Names and initials on your piece' },
  { icon: 'diamond-outline', title: 'Earrings & rings', detail: 'New pieces for your designs' },
  { icon: 'card-outline', title: 'Gift cards', detail: 'Let them design their own' },
];

export function TrustStrip() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.trust}>
      {promises.map((item) => (
        <View key={item.title} style={styles.trustItem}>
          <Icon name={item.icon} size={20} color={theme.colors.accent} />
          <Text style={styles.trustTitle}>{item.title}</Text>
          <Text style={styles.trustDetail}>{item.detail}</Text>
        </View>
      ))}
    </View>
  );
}

export function ComingSoon() {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={ui.eyebrow}>ON THE WORKBENCH</Text>
        <Text style={styles.heading}>Coming soon</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}>
        {upcoming.map((item) => (
          <View key={item.title} style={styles.soonCard}
            accessible accessibilityLabel={`${item.title}, coming soon. ${item.detail}`}>
            <View style={ui.between}>
              <View style={styles.soonIcon}>
                <Icon name={item.icon} size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SOON</Text>
              </View>
            </View>
            <Text style={styles.soonTitle}>{item.title}</Text>
            <Text style={styles.trustDetail}>{item.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    trust: {
      flexDirection: 'row',
      gap: 8,
      padding: 16,
      borderRadius: 18,
      backgroundColor: c.soft,
    },
    trustItem: { flex: 1, gap: 4, alignItems: 'center' },
    trustTitle: { color: c.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    trustDetail: { color: c.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
    soonCard: {
      width: 170,
      padding: 14,
      gap: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    soonIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: c.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c.elevated },
    badgeText: { color: c.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    soonTitle: { color: c.text, fontSize: 14, fontWeight: '600' },
  });
};
