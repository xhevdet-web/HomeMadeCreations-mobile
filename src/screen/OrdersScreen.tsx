import { useTheme } from '@/hooks/useTheme';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState, Header, Page, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { productById } from '@/services/catalog';
import { money } from '@/helper/pricing';

export default function OrdersScreen() {
  const theme = useTheme();
  const ui = useUI();

  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders).filter(
    (order) => order.userId === user?.id,
  );
  return (
    <Page>
      <Header title="My Orders" subtitle="From your imagination to your doorstep." />
      <View>
        <Text style={ui.eyebrow}>HANDMADE, JUST FOR YOU</Text>
        <Text style={ui.title}>Good things take care.</Text>
      </View>
      {orders.map((order) => (
        <View key={order.id} style={ui.card}>
          <View style={ui.between}>
            <Text style={ui.label}>{order.number}</Text>
            <View
              style={{
                paddingHorizontal: 11,
                paddingVertical: 6,
                backgroundColor: theme.colors.statusSurface,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, color: theme.colors.gold }}>{order.status}</Text>
            </View>
          </View>
          <View style={ui.row}>
            <JewelryCanvas
              items={order.designs[0].design.items}
              type={productById[order.designs[0].design.productId].type}
              size={100}
            />
            <View style={{ flex: 1, gap: 8 }}>
              <Text
                style={{
                  fontFamily: theme.fonts.editorial,
                  fontSize: 20,
                  color: theme.colors.text,
                }}
              >
                {order.designs[0].design.name}
              </Text>
              <Text style={ui.caption}>
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Text style={ui.label}>{money(order.total)} · delivery included</Text>
            </View>
          </View>
          <View style={ui.divider} />
          <Text style={ui.caption}>
            Delivery to {order.address.fullName}
            {'\n'}
            {order.address.street}, {order.address.city} {order.address.postalCode},{' '}
            {order.address.country}
          </Text>
          <Text style={ui.caption}>Demo order · no payment collected or shipment created.</Text>
        </View>
      ))}
      {!orders.length && (
        <EmptyState
          icon="bag-handle-outline"
          title="Something special is coming."
          description="Your handmade journey starts with an idea. Your local orders will appear here."
          action="Create your first piece"
          onPress={() => router.push('/')}
        />
      )}
    </Page>
  );
}
