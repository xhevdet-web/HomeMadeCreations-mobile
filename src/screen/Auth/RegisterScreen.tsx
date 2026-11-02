import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PASSWORD_MIN_LENGTH } from '@/helper/passwordPolicy';
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
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { PasswordMatch, PasswordStrength } from './components/PasswordChecks';

export default function RegisterScreen() {
  const { t } = useTranslation();
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
    toast.info(t('auth.register.creating'));
    try {
      const { confirm: _confirm, ...input } = form;
      await register(input).unwrap();
      setForm((current) => ({ ...current, password: '', confirm: '' }));
      toast.success(t('auth.register.created'));
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
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      tagline={t('auth.register.tagline')}
      highlights={[
        { icon: 'color-palette-outline', label: t('auth.register.highlightDesign') },
        { icon: 'hand-left-outline', label: t('auth.register.highlightHandmade') },
        { icon: 'cash-outline', label: t('auth.register.highlightPayOnDelivery') },
      ]}
      switchPrompt={t('auth.register.haveAccount')}
      switchAction={t('auth.register.logIn')}
      onSwitch={() => router.replace({ pathname: '/login', params: { next } })}
    >
      <View style={{ gap: 16 }}>
        <GoogleSignInButton />
        <FormSection title={t('auth.register.aboutYou')} icon="person-outline">
          <Field label={t('auth.register.firstName')} icon="person-outline" value={form.firstName}
            onChangeText={update('firstName')} autoComplete="given-name" />
          <Field label={t('auth.register.lastName')} icon="person-outline" value={form.lastName}
            onChangeText={update('lastName')} autoComplete="family-name" />
        </FormSection>

        <FormSection title={t('auth.register.yourAccount')} icon="lock-closed-outline"
          hint={t('auth.register.accountHint')}>
          <Field label={t('auth.register.email')} icon="mail-outline" value={form.email}
            onChangeText={update('email')} keyboardType="email-address" autoCapitalize="none"
            autoComplete="email" autoCorrect={false} />
          <PasswordInput label={t('auth.register.password')}
            placeholder={t('auth.register.passwordPlaceholder', { count: PASSWORD_MIN_LENGTH })}
            value={form.password} onChangeText={update('password')} autoComplete="new-password" />
          <PasswordStrength password={form.password} />
          <PasswordInput label={t('auth.register.confirmPassword')} value={form.confirm}
            onChangeText={update('confirm')} />
          <PasswordMatch password={form.password} confirm={form.confirm} />
        </FormSection>

        <View style={{ gap: 18 }}>
          <AuthFeedback error={error} />
          <Button loading={busy} title={t('auth.register.submit')} icon="arrow-forward" onPress={submit} />
        </View>
      </View>
    </AuthLayout>
  );
}
