import { Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { DetailRow, ProductOverview } from '@/components/checkout/ProductOverview';
import { useTheme } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import type { ApiOrder } from '@/api/commerceModels';
import { useTranslation } from 'react-i18next';

export function OrderPlaced({ order }: { order: ApiOrder }) {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const paid = order.paymentStatus === 'PAID';
  const cashOnDelivery = order.paymentType === 'CASH_ON_DELIVERY';
  return (
    <>
      <View style={{ alignItems: 'center', gap: 14, paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkmark" size={36} color={theme.colors.onPrimary} />
        </View>
        <Text
          accessibilityRole="header"
          style={[ui.title, { textAlign: 'center', fontSize: 32, lineHeight: 39 }]}
        >
          {order.firstName ? t('confirmation.thankYouName', { name: order.firstName }) : t('confirmation.thankYou')}
        </Text>
        <Text style={[ui.body, { textAlign: 'center' }]}>{t('confirmation.placed')}</Text>
      </View>
      <ProductOverview product={order.product} />
      <View style={ui.card}>
        <DetailRow label={t('confirmation.orderNumber')} value={order.orderNumber} />
        <DetailRow
          label={paid ? t('orderDetails.paid') : cashOnDelivery ? t('orderDetails.dueOnDelivery') : t('confirmation.orderTotal')}
          value={money(order.totalPrice)}
        />
        <Text style={ui.caption}>
          {[cashOnDelivery && !paid ? t('confirmation.payCash') : '', t('confirmation.followProgress')]
            .filter(Boolean).join(' ')}
        </Text>
      </View>
    </>
  );
}
