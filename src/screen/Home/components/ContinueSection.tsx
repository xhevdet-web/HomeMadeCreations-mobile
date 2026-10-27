import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export interface ContinueItem {
  key: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  detail: string;
  onPress: () => void;
}

/** Work in progress; the whole section is left out when there is none. */
export function ContinueSection({ items }: { items: ContinueItem[] }) {
  const ui = useUI();
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.eyebrow}>{t('home.continueTitle')}</Text>
      {items.map((item) => <ContinueCard key={item.key} item={item} />)}
    </View>
  );
}

function ContinueCard({ item }: { item: ContinueItem }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('home.continueLabel', { title: item.title, detail: item.detail })}
      onPress={item.onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.icon}>
        <Icon name={item.icon} size={20} color={theme.colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.eyebrow}>{item.eyebrow}</Text>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.detail} numberOfLines={1}>{item.detail}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 18,
    },
    icon: {
      width: 42, height: 42, borderRadius: 14, backgroundColor: c.soft,
      alignItems: 'center', justifyContent: 'center',
    },
    eyebrow: { color: c.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 17 },
    detail: { color: c.muted, fontSize: 12 },
  });
};
