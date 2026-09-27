import { useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field, Header, Page, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import { commerceApi, DeliveryInput } from '@/services/commerceApi';
import { User } from '@/types/models';

function ProfileForm({ user }: { user: User }) {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const ui = useUI();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [country, setCountry] = useState(user.address.country);
  const [address, setAddress] = useState(user.address.street);
  const [postalCode, setPostalCode] = useState(user.address.postalCode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    if (busy) return;
    const changes: DeliveryInput = {};
    const fields = [
      ['firstName', 'First name', firstName, user.firstName],
      ['lastName', 'Last name', lastName, user.lastName],
      ['phone', 'Phone', phone, user.phone ?? ''],
      ['country', 'Country', country, user.address.country],
      ['address', 'Address', address, user.address.street],
    ] as const;
    for (const [key, label, value, original] of fields) {
      if (value.trim() === original.trim()) continue;
      if (!value.trim()) {
        setMessage(`${label} cannot be empty.`);
        return;
      }
      changes[key] = value.trim();
    }
    if (postalCode.trim() !== user.address.postalCode.trim())
      changes.postalCode = postalCode.trim() || null;
    if (!Object.keys(changes).length) {
      setMessage('No changes to save.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const updated = await commerceApi.updateProfile(changes);
      useAuthStore.getState().update(updated);
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setPhone(updated.phone ?? '');
      setCountry(updated.address.country);
      setAddress(updated.address.street);
      setPostalCode(updated.address.postalCode);
      setMessage('Your details have been saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Text style={ui.body}>{user.email}</Text>
      <Field label="First name" value={firstName} onChangeText={setFirstName} maxLength={100} />
      <Field label="Last name" value={lastName} onChangeText={setLastName} maxLength={100} />
      <Field
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={32}
      />
      <Field label="Country" value={country} onChangeText={setCountry} maxLength={100} />
      <Field label="Address" value={address} onChangeText={setAddress} multiline maxLength={300} />
      <Field
        label="Postal code (optional)"
        value={postalCode}
        onChangeText={setPostalCode}
        maxLength={20}
      />
      {!!message && (
        <Text accessibilityRole="alert" style={ui.body}>
          {message}
        </Text>
      )}
      <Button title="Save my details" loading={busy} onPress={() => void save()} />
      {next === 'checkout' && (
        <Button
          title="Return to order"
          secondary
          disabled={busy}
          onPress={() => router.replace('/checkout')}
        />
      )}
      <Button title="My Designs" secondary onPress={() => router.push('/designs')} />
      <Button title="My Orders" secondary onPress={() => router.push('/orders')} />
      <Button
        title="Sign out"
        secondary
        disabled={busy}
        onPress={() => void useAuthStore.getState().logout()}
      />
    </>
  );
}
export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  return (
    <Page>
      <Header title="Your profile" />
      {user ? (
        <ProfileForm key={user.id} user={user} />
      ) : (
        <Button title="Sign in" onPress={() => router.push('/login')} />
      )}
    </Page>
  );
}
