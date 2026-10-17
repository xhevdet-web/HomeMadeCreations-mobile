import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { User } from '@/types/models';

export function ProfileHeader({ user, onEdit }: { user: User; onEdit: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Your account';
  const initials = [user.firstName, user.lastName]
    .map((part) => part?.trim()[0] ?? '')
    .join('')
    .toUpperCase() || user.email[0]?.toUpperCase();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Edit personal details"
      onPress={onEdit}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{user.email}</Text>
        {!!user.userName && <Text style={styles.meta}>@{user.userName}</Text>}
      </View>
      <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: { color: c.onPrimary, fontSize: 21, fontWeight: '600', letterSpacing: 1 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 21 },
    meta: { color: c.muted, fontSize: 12 },
  });
};
