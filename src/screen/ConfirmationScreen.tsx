import { useTheme } from '@/hooks/useTheme';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Icon, Page, useUI } from '@/components/common/ui';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';

import { money } from '@/helper/pricing';
export default function ConfirmationScreen() {
  const theme = useTheme();
  const ui = useUI();

  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const order = useOrderStore((state) => state.orders).find(
    (entry) => entry.id === id && entry.userId === user?.id,
  );
  return (
    <Page>
      <Header title="A little moment of joy" />
      <View style={{ alignItems: 'center', gap: 25, paddingVertical: 38 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.colors.confirmationSurface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.confirmationBorder,
          }}
        >
          <Icon name={order ? 'checkmark' : 'heart-outline'} size={42} color={theme.colors.gold} />
        </View>
        <Text style={[ui.title, { textAlign: 'center' }]}>
          {order ? 'Thank you for\nyour order!' : 'Your creations await.'}
        </Text>
        <Text style={[ui.body, { textAlign: 'center' }]}>
          {order
            ? 'Your handmade creation is on its way to becoming real.'
            : 'Visit My Orders to see your saved local orders.'}
        </Text>
      </View>
      {order && (
        <View style={ui.card}>
          <View style={ui.between}>
            <Text style={ui.caption}>Order number</Text>
            <Text style={ui.label}>{order.number}</Text>
          </View>
          <View style={ui.between}>
            <Text style={ui.caption}>Total</Text>
            <Text style={ui.label}>{money(order.total)}</Text>
          </View>
          <Text style={ui.caption}>
            Demo order saved on this device. No payment, email, or shipment has been sent.
          </Text>
        </View>
      )}
      <Button
        title="View my orders"
        icon="arrow-forward"
        onPress={() => router.replace('/orders')}
      />
      <Button title="Keep exploring" secondary onPress={() => router.replace('/')} />
    </Page>
  );
}
