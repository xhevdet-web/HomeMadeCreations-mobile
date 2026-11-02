import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Field, useUI } from '@/components/common/ui';
import { PasswordInput } from '@/components/common/PasswordInput';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useLoginMutation } from '@/api/endpoints/authSlice';
import { loginErrorMessage, validateLogin } from './authForm';
import { AuthLayout } from './components/AuthLayout';
import { AuthFeedback } from './components/AuthFeedback';
import { GoogleSignInButton } from './components/GoogleSignInButton';

export default function LoginScreen() {
  const ui = useUI();
  const { t } = useTranslation();
  const { next } = useLocalSearchParams<{ next?: string; registered?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useFeedbackState();
  const [busy, setBusy] = useState(false);
  const [login, loginState] = useLoginMutation();

  async function submit() {
    if (busy) return;
    setError('');
    const invalid = validateLogin(email, password);
    if (invalid) return setError(invalid);
    setBusy(true);
    toast.info(t('auth.login.signingIn'));
    try {
      const ticket = useAuthStore.getState().beginLogin();
      const tokens = await login({ email, password }).unwrap();
      if (!await useAuthStore.getState().acceptLogin(tokens, ticket)) return;
      setPassword('');
      toast.success(t('auth.login.signedIn'));
      // The protected navigator opens Home once the session is authenticated.
    } catch (failure) {
      setError(loginErrorMessage(failure));
    } finally {
      loginState.reset();
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      tagline={t('auth.login.tagline')}
      switchPrompt={t('auth.login.noAccount')}
      switchAction={t('auth.login.signUp')}
      onSwitch={() => router.replace({ pathname: '/register', params: { next } })}
    >
      <View style={{ gap: 18 }}>
        <GoogleSignInButton />
        <Field
          label={t('auth.login.email')}
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
        />
        <PasswordInput
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        <Pressable accessibilityRole="button" accessibilityLabel={t('auth.login.forgotPassword')} hitSlop={8}
          style={{ alignSelf: 'flex-end', marginTop: -6 }}
          onPress={() => toast.info(t('auth.login.forgotPasswordSoon'))}>
          <Text style={ui.textLink}>{t('auth.login.forgotPassword')}</Text>
        </Pressable>
        <AuthFeedback error={error} />
        <Button loading={busy} title={t('auth.login.submit')} icon="arrow-forward" onPress={submit} />
      </View>
    </AuthLayout>
  );
}
