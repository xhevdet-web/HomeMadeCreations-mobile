import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton, useUI } from '@/components/common/ui';

export function Pagination({ page, totalPages, disabled, onChange }: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  return (
    <View style={[ui.between, { justifyContent: 'center', gap: 18 }]}>
      <IconButton
        name="chevron-back"
        label={t('common.previousPage')}
        disabled={disabled || page <= 1}
        onPress={() => onChange(page - 1)}
      />
      <Text style={ui.caption}>
        {t('common.pageOf', { page, total: totalPages })}
      </Text>
      <IconButton
        name="chevron-forward"
        label={t('common.nextPage')}
        disabled={disabled || page >= totalPages}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}
