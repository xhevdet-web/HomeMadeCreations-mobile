import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Icon, IconName } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';

export function TextAction({
  title,
  onPress,
  icon,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled || pressed ? 0.5 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.accent} />
      ) : (
        icon && <Icon name={icon} size={16} color={theme.colors.accent} />
      )}
      <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}
