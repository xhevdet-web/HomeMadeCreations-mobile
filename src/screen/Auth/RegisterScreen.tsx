import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field } from '@/components/common/ui';
import { PasswordInput } from '@/components/common/PasswordInput';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useRegisterMutation } from '@/api/endpoints/authSlice';
import {
  emptyRegistration,
  registrationErrorMessage,
  validateRegistration,
  type RegistrationForm,
} from './authForm';
import { AuthLayout, FormSection } from './components/AuthLayout';
import { AuthFeedback } from './components/AuthFeedback';
import { PasswordMatch, PasswordStrength } from './components/PasswordChecks';

export default function RegisterScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [form, setForm] = useState<RegistrationForm>(emptyRegistration);
  const [error, setError] = useFeedbackState();
  const [busy, setBusy] = useState(false);
  const [register, registerState] = useRegisterMutation();
  const update = (key: keyof RegistrationForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    if (busy) return;
    setError('');
    const invalid = validateRegistration(form);
    if (invalid) return setError(invalid);
    setBusy(true);
    toast.info('Creating your account. Please wait for confirmation before continuing.');
    try {
      const { confirm: _confirm, ...input } = form;
      await register(input).unwrap();
      setForm((current) => ({ ...current, password: '', confirm: '' }));
      toast.success('Account created successfully. Please log in. Next, choose a product or start your design.');
      router.replace({ pathname: '/login', params: { next, registered: '1' } });
    } catch (failure) {
      setError(registrationErrorMessage(failure));
    } finally {
      registerState.reset();
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join our creative community. It takes less than a minute."
      tagline="Your idea. Made real."
      highlights={[
        { icon: 'color-palette-outline', label: 'Design your own' },
        { icon: 'hand-left-outline', label: 'Handmade for you' },
        { icon: 'cash-outline', label: 'Pay on delivery' },
      ]}
      backLabel="Back to login"
      onBack={() => router.replace('/login')}
      switchPrompt="Already have an account? "
      switchAction="Log In"
      onSwitch={() => router.replace({ pathname: '/login', params: { next } })}
    >
      <View style={{ gap: 16 }}>
        <FormSection title="About you" icon="person-outline">
          <Field label="First name" icon="person-outline" value={form.firstName}
            onChangeText={update('firstName')} autoComplete="given-name" />
          <Field label="Last name" icon="person-outline" value={form.lastName}
            onChangeText={update('lastName')} autoComplete="family-name" />
        </FormSection>

        <FormSection title="Your account" icon="lock-closed-outline"
          hint="You can sign in with your email or username.">
          <Field label="Email address" icon="mail-outline" value={form.email}
            onChangeText={update('email')} keyboardType="email-address" autoCapitalize="none"
            autoComplete="email" autoCorrect={false} />
          <Field label="Username (optional)" icon="at-outline"
            placeholder="3–30 letters, numbers, dots, _ or -" value={form.userName}
            onChangeText={update('userName')} autoCapitalize="none" autoCorrect={false}
            autoComplete="username" maxLength={30} />
          <PasswordInput label="Password" placeholder="At least 12 characters"
            value={form.password} onChangeText={update('password')} autoComplete="new-password" />
          <PasswordStrength password={form.password} />
          <PasswordInput label="Confirm password" value={form.confirm}
            onChangeText={update('confirm')} />
          <PasswordMatch password={form.password} confirm={form.confirm} />
        </FormSection>

        <FormSection title="Delivery details" icon="location-outline"
          hint="Optional. Add them now to order in one tap later.">
          <Field label="Phone (optional)" icon="call-outline" value={form.phone}
            onChangeText={update('phone')} keyboardType="phone-pad" autoComplete="tel" maxLength={32} />
          <Field label="Country (optional)" icon="globe-outline" value={form.country}
            onChangeText={update('country')} autoComplete="country" maxLength={100} />
          <Field label="Address (optional)" icon="home-outline" value={form.address}
            onChangeText={update('address')} autoComplete="street-address" maxLength={300} />
          <Field label="Postal code (optional)" icon="location-outline" value={form.postalCode}
            onChangeText={update('postalCode')} autoComplete="postal-code" maxLength={20} />
        </FormSection>

        <View style={{ gap: 18 }}>
          <AuthFeedback error={error} />
          <Button loading={busy} title="Create Account" icon="arrow-forward" onPress={submit} />
        </View>
      </View>
    </AuthLayout>
  );
}
