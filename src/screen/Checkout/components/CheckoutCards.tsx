import { Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { TextAction } from '@/components/common/TextAction';
import { useTheme } from '@/hooks/useTheme';
import { User } from '@/types/models';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <View style={ui.card}>
      <View style={ui.between}>
        <View style={ui.row}>
          <Icon name="location-outline" color={theme.colors.accent} />
          <Text style={ui.label}>{t('checkout.deliverTo')}</Text>
        </View>
        <TextAction title={t('checkout.editDelivery')} onPress={onEdit} disabled={disabled} />
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
            .join(', ') || t('checkout.addAddress')}
        </Text>
        <Text style={ui.caption}>{user.phone || t('checkout.addPhone')}</Text>
      </View>
    </View>
  );
}

export function CashOnDeliveryCard() {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[ui.card, { flexDirection: 'row', gap: 14, alignItems: 'center' }]}>
      <Icon name="wallet-outline" color={theme.colors.accent} size={24} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={ui.label}>{t('payment.cashOnDelivery')}</Text>
        <Text style={ui.caption}>{t('checkout.cashOnDeliveryHint')}</Text>
      </View>
      <Icon name="checkmark-circle" color={theme.colors.accent} size={20} />
    </View>
  );
}
