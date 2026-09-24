import { useTheme } from '@/hooks/useTheme';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Field, Header, Icon, Page, useUI } from '@/components/common/ui';
import { PriceBreakdown } from '@/components/common/PriceBreakdown';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useSavedStore } from '@/store/savedStore';
import { productById } from '@/services/catalog';
import { DELIVERY_PRICE } from '@/constants/theme';
import { Design, User } from '@/types/models';
import { hasRequiredValues, isValidEmail } from '@/helper/validation';
function CheckoutForm({ design, user }: { design: Design; user: User }) {
  const theme = useTheme();
  const ui = useUI();

  const [fullName, setFullName] = useState(user.address.fullName);
  const [street, setStreet] = useState(user.address.street);
  const [city, setCity] = useState(user.address.city);
  const [postalCode, setPostalCode] = useState(user.address.postalCode);
  const [country, setCountry] = useState(user.address.country);
  const [email, setEmail] = useState(user.email);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'delivery'>('delivery');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const placing = useRef(false);
  const product = productById[design.productId];
  function place() {
    if (placing.current || !useCartStore.getState().design) return;
    if (!hasRequiredValues(fullName, street, city, postalCode, country))
      return setError('Please complete every delivery field.');
    if (!isValidEmail(email)) return setError('Please enter a valid email address.');
    placing.current = true;
    setSubmitting(true);
    const ownedDesign = { ...design, userId: user.id };
    const order = useOrderStore.getState().place(
      ownedDesign,
      {
        ...user.address,
        fullName: fullName.trim(),
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      },
      email.trim(),
    );
    useSavedStore.getState().save(ownedDesign);
    useCartStore.getState().clear();
    router.replace({ pathname: '/confirmation', params: { id: order.id } });
  }
  return (
    <>
      <View>
        <Text style={ui.title}>Delivery Information</Text>
      </View>
      <View style={ui.card}>
        <View style={ui.row}>
          <JewelryCanvas items={design.items} type={product.type} size={100} />
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={ui.sectionTitle}>{design.name}</Text>
            <Text style={ui.caption}>
              {product.name} · {design.size}
            </Text>
          </View>
        </View>
        <PriceBreakdown
          productName={product.name}
          basePrice={product.basePrice}
          items={design.items}
          delivery={DELIVERY_PRICE}
        />
      </View>
      <View style={ui.row}>
        <Icon name="location-outline" color={theme.colors.gold} />
        <Text style={ui.sectionTitle}>A place to call home</Text>
      </View>
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field
        label="Street address"
        value={street}
        onChangeText={setStreet}
        autoComplete="street-address"
        multiline
      />
      <Field label="City" value={city} onChangeText={setCity} />
      <Field
        label="Postal code"
        value={postalCode}
        onChangeText={setPostalCode}
        autoComplete="postal-code"
      />
      <Field label="Country" value={country} onChangeText={setCountry} />
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={ui.sectionTitle}>Payment Method</Text>
      <View style={{ gap: 10 }}>
        {([['delivery', 'Cash on Delivery'], ['card', 'Card']] as const).map(([value, label]) => (
          <Button key={value} title={`${paymentMethod === value ? '◉' : '○'} ${label}`}
            secondary onPress={() => setPaymentMethod(value)} />
        ))}
      </View>
      {paymentMethod === 'card' && <Text style={ui.caption}>Card payment is unavailable in this demo. Choose Cash on Delivery to place a demo order.</Text>}
      {error ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      ) : null}
      <View style={ui.card}>
        <Text style={ui.label}>A little rehearsal</Text>
        <Text style={ui.caption}>
          This is a demo order, saved only on this device. No payment is collected and no physical
          order is sent.
        </Text>
      </View>
      <Button title="Place Order" icon="heart-outline" onPress={place} loading={submitting} disabled={paymentMethod === 'card'} />
    </>
  );
}
export default function CheckoutScreen() {
  const design = useCartStore((state) => state.design);
  const user = useAuthStore((state) => state.user);
  return (
    <Page>
      <Header title="Your order" back />
      {!design ? (
        <EmptyState
          icon="bag-handle-outline"
          title="Your bag is waiting."
          description="Add a creation from its preview or from My Designs."
          action="Explore your designs"
          onPress={() => router.replace('/designs')}
        />
      ) : !user ? (
        <>
          <EmptyState
            icon="person-outline"
            title="A name behind the creation."
            description="Sign in or create a local profile to complete your demo order. Your creation is safely in your bag."
            action="Create an account"
            onPress={() => router.push({ pathname: '/register', params: { next: 'checkout' } })}
          />
          <Button
            title="Sign in"
            secondary
            onPress={() => router.push({ pathname: '/login', params: { next: 'checkout' } })}
          />
        </>
      ) : (
        <CheckoutForm key={design.id + user.id} design={design} user={user} />
      )}
    </Page>
  );
}
