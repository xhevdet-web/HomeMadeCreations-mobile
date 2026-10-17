import { Text, View } from 'react-native';
import { IconButton, useUI } from '@/components/common/ui';

export function Pagination({ page, totalPages, disabled, onChange }: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  const ui = useUI();
  return (
    <View style={[ui.between, { justifyContent: 'center', gap: 18 }]}>
      <IconButton
        name="chevron-back"
        label="Previous page"
        disabled={disabled || page <= 1}
        onPress={() => onChange(page - 1)}
      />
      <Text style={ui.caption}>
        Page {page} of {totalPages}
      </Text>
      <IconButton
        name="chevron-forward"
        label="Next page"
        disabled={disabled || page >= totalPages}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}
