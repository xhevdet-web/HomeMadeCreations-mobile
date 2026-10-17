import { Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';

export function FlowStep({ step }: { step: 1 | 2 }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`Step ${step} of 2: ${step === 1 ? 'Your design' : 'Delivery and payment'}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      {['Your design', 'Delivery & payment'].map((label, index) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View
            style={{
              width: 23,
              height: 23,
              borderRadius: 12,
              backgroundColor: index + 1 <= step ? theme.colors.primary : theme.colors.elevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {index + 1 < step ? (
              <Icon name="checkmark" size={13} color={theme.colors.onPrimary} />
            ) : (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: index + 1 === step ? theme.colors.onPrimary : theme.colors.muted,
                }}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 11,
              color: index + 1 === step ? theme.colors.text : theme.colors.muted,
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
