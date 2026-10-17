import { Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { TextAction } from '@/components/common/TextAction';
import { useTheme } from '@/hooks/useTheme';
import { User } from '@/types/models';

export function DeliveryCard({
  user,
  onEdit,
  disabled,
}: {
  user: User;
  onEdit: () => void;
  disabled: boolean;
}) {
  const ui = useUI();
  const theme = useTheme();
  return (
    <View style={ui.card}>
      <View style={ui.between}>
        <View style={ui.row}>
          <Icon name="location-outline" color={theme.colors.accent} />
          <Text style={ui.label}>Deliver to</Text>
        </View>
        <TextAction title="Edit delivery" onPress={onEdit} disabled={disabled} />
      </View>
      <View style={{ gap: 5 }}>
        <Text style={ui.label}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={ui.body}>
          {[
            user.address?.street,
            user.address?.city,
            user.address?.postalCode,
            user.address?.country,
          ]
            .filter(Boolean)
            .join(', ') || 'Add your delivery address'}
        </Text>
        <Text style={ui.caption}>{user.phone || 'Add a phone number'}</Text>
      </View>
    </View>
  );
}

export function CashOnDeliveryCard() {
  const ui = useUI();
  const theme = useTheme();
  return (
    <View style={[ui.card, { flexDirection: 'row', gap: 14, alignItems: 'center' }]}>
      <Icon name="wallet-outline" color={theme.colors.accent} size={24} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={ui.label}>Cash on Delivery</Text>
        <Text style={ui.caption}>Nothing to pay now. Pay when your piece arrives.</Text>
      </View>
      <Icon name="checkmark-circle" color={theme.colors.accent} size={20} />
    </View>
  );
}
