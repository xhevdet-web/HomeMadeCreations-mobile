import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import type { DeliveryInput } from '@/api/commerceModels';
import { useUpdateProfileMutation } from '@/api/endpoints/userSlice';
import { apiError } from '@/api/apiSlice';
import { User } from '@/types/models';
import { useTranslation } from 'react-i18next';

export function ProfileForm({ user, returnToCheckout = false }: {
  user: User;
  returnToCheckout?: boolean;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [country, setCountry] = useState(user.address.country);
  const [address, setAddress] = useState(user.address.street);
  const [postalCode, setPostalCode] = useState(user.address.postalCode);
  const [busy, setBusy] = useState(false);
  const [updateProfile] = useUpdateProfileMutation();
  const [message, setMessage] = useFeedbackState('info');
  async function save() {
    if (busy) return;
    const changes: DeliveryInput = {};
    const fields = [
      ['firstName', t('account.firstName'), firstName, user.firstName],
      ['lastName', t('account.lastName'), lastName, user.lastName],
      ['phone', t('account.phone'), phone, user.phone ?? ''],
      ['country', t('account.country'), country, user.address.country],
      ['address', t('account.address'), address, user.address.street],
    ] as const;
    for (const [key, label, value, original] of fields) {
      if (value.trim() === original.trim()) continue;
      if (!value.trim()) {
        setMessage(t('validation.fieldEmpty', { field: label }), 'error');
        return;
      }
      changes[key] = value.trim();
    }
    if (postalCode.trim() !== user.address.postalCode.trim())
      changes.postalCode = postalCode.trim() || null;
    if (!Object.keys(changes).length) {
      if (returnToCheckout) {
        router.dismissTo('/checkout');
        return;
      }
      setMessage(t('account.noChanges'));
      return;
    }
    setBusy(true);
    toast.info(t('account.saving'));
    setMessage('');
    try {
      const updated = await updateProfile(changes).unwrap();
      useAuthStore.getState().update(updated);
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setPhone(updated.phone ?? '');
      setCountry(updated.address.country);
      setAddress(updated.address.street);
      setPostalCode(updated.address.postalCode);
      setMessage(t('account.saved'));
      toast.success(
        returnToCheckout ? t('account.savedDelivery') : t('account.savedProfile'),
      );
      if (returnToCheckout) router.dismissTo('/checkout');
    } catch (error) {
      const message = apiError(error).message;
      setMessage(message);
      toast.error(t('account.saveFailed', { message }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <View style={[ui.card, { gap: 18 }]}>
        <Text style={ui.eyebrow}>{t('account.personalInformation')}</Text>
        <Field label={t('account.firstName')} value={firstName} onChangeText={setFirstName} maxLength={100} />
        <Field label={t('account.lastName')} value={lastName} onChangeText={setLastName} maxLength={100} />
        <Field
          label={t('account.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={32}
        />
        <View style={{ gap: 4 }}>
          <Text style={ui.label}>{t('account.email')}</Text>
          <Text style={ui.body}>{user.email}</Text>
        </View>
      </View>
      <View style={[ui.card, { gap: 18 }]}>
        <Text style={ui.eyebrow}>{t('account.deliveryAddress')}</Text>
        <Field label={t('account.country')} value={country} onChangeText={setCountry} maxLength={100} />
        <Field label={t('account.address')} value={address} onChangeText={setAddress} multiline maxLength={300} />
        <Field
          label={t('account.postalCode')}
          value={postalCode}
          onChangeText={setPostalCode}
          maxLength={20}
        />
      </View>
      {!!message && (
        <Text accessibilityRole="alert" style={ui.body}>
          {message}
        </Text>
      )}
      <Button
        title={returnToCheckout ? t('account.saveAndReturn') : t('account.save')}
        loading={busy}
        onPress={() => void save()}
      />
    </>
  );
}
