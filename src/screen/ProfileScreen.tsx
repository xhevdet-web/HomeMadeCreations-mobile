import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  EmptyState,
  Field,
  Header,
  Icon,
  Notice,
  Page,
  useUI,
} from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types/models';

import { hasRequiredValues, isValidEmail } from '@/helper/validation';

function ProfileForm({ user }: { user: User }) {
  const theme = useTheme();
  const ui = useUI();

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [street, setStreet] = useState(user.address.street);
  const [city, setCity] = useState(user.address.city);
  const [postalCode, setPostalCode] = useState(user.address.postalCode);
  const [country, setCountry] = useState(user.address.country);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  function save() {
    if (!hasRequiredValues(firstName, lastName, street) || !isValidEmail(email))
      return setError('Please complete your name, address, and a valid email.');
    useAuthStore.getState().update({
      ...user,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      address: {
        ...user.address,
        fullName: firstName.trim() + ' ' + lastName.trim(),
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      },
    });
    setError('');
    setSaved(true);
  }
  return (
    <>
      <View style={[ui.card, ui.row]}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            backgroundColor: theme.colors.avatar,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{ color: theme.colors.gold, fontFamily: theme.fonts.editorial, fontSize: 26 }}
          >
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ui.sectionTitle}>Hello, {user.firstName}.</Text>
          <Text style={ui.caption}>A maker of little wonders.</Text>
        </View>
        <Icon name="sparkles-outline" color={theme.colors.gold} />
      </View>
      <Text style={ui.sectionTitle}>Personal information</Text>
      <Field
        label="First name"
        value={firstName}
        onChangeText={(value) => {
          setFirstName(value);
          setSaved(false);
        }}
      />
      <Field
        label="Last name"
        value={lastName}
        onChangeText={(value) => {
          setLastName(value);
          setSaved(false);
        }}
      />
      <Field
        label="Email address"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setSaved(false);
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={ui.sectionTitle}>Delivery address</Text>
      <Field
        label="Street address"
        value={street}
        onChangeText={(value) => {
          setStreet(value);
          setSaved(false);
        }}
        multiline
      />
      <Field
        label="City"
        value={city}
        onChangeText={(value) => {
          setCity(value);
          setSaved(false);
        }}
      />
      <Field
        label="Postal code"
        value={postalCode}
        onChangeText={(value) => {
          setPostalCode(value);
          setSaved(false);
        }}
      />
      <Field
        label="Country"
        value={country}
        onChangeText={(value) => {
          setCountry(value);
          setSaved(false);
        }}
      />
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {saved && <Notice text="Your details have been updated." />}
      <Button title="Save my details" onPress={save} />
      <View style={ui.divider} />
      <Button
        title="My Designs"
        secondary
        icon="heart-outline"
        onPress={() => router.push('/designs')}
      />
      <Button
        title="My Orders"
        secondary
        icon="bag-handle-outline"
        onPress={() => router.push('/orders')}
      />
      <Button
        title="Sign out"
        secondary
        icon="log-out-outline"
        onPress={() => {
          void useAuthStore.getState().logout();
        }}
      />
      <Text style={[ui.caption, { textAlign: 'center' }]}>
        Profile edits are local to this session.
      </Text>
    </>
  );
}
export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  return (
    <Page>
      <Header title="Your little corner" />
      {user ? (
        <ProfileForm key={user.id} user={user} />
      ) : (
        <>
          <EmptyState
            icon="person-outline"
            title="Make yourself at home."
            description="Create a local profile to keep your details ready for your next handmade piece."
            action="Create an account"
            onPress={() => router.push('/register')}
          />
          <Button
            title="I already have an account"
            secondary
            onPress={() => router.push('/login')}
          />
        </>
      )}
    </Page>
  );
}
