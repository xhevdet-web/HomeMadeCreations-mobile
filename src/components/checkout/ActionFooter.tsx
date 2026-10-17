import { Text, View } from 'react-native';
import { Button, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';

export function ActionFooter({
  title,
  onPress,
  amount,
  amountLabel = 'Total',
  caption,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  amount?: number;
  amountLabel?: string;
  caption?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const ui = useUI();
  const theme = useTheme();
  return (
    <View
      testID="flow-action-footer"
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.bottomBar,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
          paddingHorizontal: 22,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        {amount !== undefined && (
          <View style={ui.between}>
            <Text style={ui.caption}>{amountLabel}</Text>
            <Text style={{ fontSize: 23, color: theme.colors.text, fontWeight: '600' }}>
              {money(amount)}
            </Text>
          </View>
        )}
        <Button title={title} onPress={onPress} loading={loading} disabled={disabled} />
        {!!caption && (
          <Text style={[ui.caption, { textAlign: 'center', fontSize: 11 }]}>{caption}</Text>
        )}
      </View>
    </View>
  );
}
