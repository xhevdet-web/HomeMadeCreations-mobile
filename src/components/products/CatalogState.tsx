import { ActivityIndicator, Text, View } from 'react-native';
import { Button, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <View style={{ paddingVertical: 24, gap: 16 }}>
      {loading ? (
        <>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={ui.body}>{t('catalog.loading')}</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole={error ? 'alert' : undefined} style={ui.body}>
            {error || empty}
          </Text>
          <Button title={t('common.retry')} secondary onPress={retry} />
        </>
      )}
    </View>
  );
}
