import { ActivityIndicator, Text, View } from 'react-native';
import { Button, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';

export function CatalogState({
  loading,
  error,
  empty,
  retry,
}: {
  loading: boolean;
  error: string;
  empty: string;
  retry: () => void;
}) {
  const ui = useUI();
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: 24, gap: 16 }}>
      {loading ? (
        <>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={ui.body}>Loading catalog…</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole={error ? 'alert' : undefined} style={ui.body}>
            {error || empty}
          </Text>
          <Button title="Retry" secondary onPress={retry} />
        </>
      )}
    </View>
  );
}
