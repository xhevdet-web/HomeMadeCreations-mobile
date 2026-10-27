import { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon, IconName } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  soon = false,
  danger = false,
  last = false,
  toggle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  soon?: boolean;
  danger?: boolean;
  last?: boolean;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
  const styles = useThemedStyles(createStyles);
  const color = danger ? c.danger : c.text;
  const content = (
    <>
      <View style={[styles.iconWrap, danger && { backgroundColor: 'transparent' }]}>
        <Icon name={icon} size={18} color={danger ? c.danger : c.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {!!value && <Text style={styles.subtitle}>{value}</Text>}
      {soon && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('common.soon')}</Text>
        </View>
      )}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: c.border, true: c.accent }}
          thumbColor={c.surface}
          accessibilityLabel={title}
        />
      ) : (
        !danger && <Icon name="chevron-forward" size={16} color={c.muted} />
      )}
    </>
  );
  const rowStyle = [styles.row, !last && styles.divider];
  if (toggle) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: c.soft }]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    sectionTitle: {
      color: c.muted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      paddingHorizontal: 4,
    },
    group: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    divider: { borderBottomWidth: 1, borderBottomColor: c.border },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 14, fontWeight: '500' },
    subtitle: { color: c.muted, fontSize: 12 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: c.elevated,
    },
    badgeText: { color: c.muted, fontSize: 10, fontWeight: '600' },
  });
};
