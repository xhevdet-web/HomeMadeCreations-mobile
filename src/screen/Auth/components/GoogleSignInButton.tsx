import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, useUI } from '@/components/common/ui';
import { PasswordInput } from '@/components/common/PasswordInput';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { apiError } from '@/api/apiSlice';
import { useGoogleLoginMutation } from '@/api/endpoints/authSlice';
import { GoogleSignInError, googleSignInAvailable, signInWithGoogle } from '@/services/googleSignIn';

/**
 * "Continue with Google" on Login and Register alike: the API decides whether the Google account
 * signs in, is linked or becomes a new account, and answers with a normal HM Craft session.
 * Hidden where native Google Sign-In can't run (Expo Go, the web build, no client IDs).
 */
export function GoogleSignInButton() {
  const ui = useUI();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useFeedbackState();
  // An existing password account with this Google email: its password links them once.
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [googleLogin, googleLoginState] = useGoogleLoginMutation();
  if (!googleSignInAvailable()) return null;

  async function authenticate(idToken: string, linkPassword?: string) {
    const ticket = useAuthStore.getState().beginLogin();
    try {
      const { tokens, profileComplete } = await googleLogin({ idToken, password: linkPassword }).unwrap();
      if (!await useAuthStore.getState().acceptLogin(tokens, ticket)) return;
      toast.success(t('auth.login.signedIn'));
      // Missing a first or last name: ask for it once the signed-in screens are open.
      if (!profileComplete) setTimeout(() => router.push('/account'), 0);
    } catch (failure) {
      const failed = apiError(failure);
      if (failed.status === 409 && linkPassword === undefined) {
        setLinkToken(idToken);
        setPassword('');
      } else if (failed.status === 401 && failed.message === 'Incorrect password') {
        setError(t('auth.google.incorrectPassword'));
      } else if (failed.status === 0) {
        setError(failed.message);
      } else {
        setError(t(failed.status === 503 ? 'auth.google.unavailable' : 'auth.google.failed'));
      }
    } finally {
      googleLoginState.reset();
    }
  }

  async function start() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if ('cancelled' in result) toast.info(t('auth.google.cancelled'));
      else await authenticate(result.idToken);
    } catch (failure) {
      const reason = failure instanceof GoogleSignInError ? failure.reason : 'failed';
      setError(t(reason === 'playServices' ? 'auth.google.playServices' : 'auth.google.failed'));
    } finally {
      setBusy(false);
    }
  }

  async function link() {
    if (busy || !linkToken) return;
    if (!password) return setError(t('validation.passwordRequired'));
    setError('');
    setBusy(true);
    try {
      await authenticate(linkToken, password);
    } finally {
      setBusy(false);
    }
  }

  if (linkToken)
    return (
      <View style={{ gap: 14 }}>
        <Text style={ui.body}>{t('auth.google.linkExplanation')}</Text>
        <PasswordInput label={t('auth.google.linkPassword')} value={password} onChangeText={setPassword}
          autoComplete="current-password" />
        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <Button title={t('auth.google.linkSubmit')} icon="logo-google" loading={busy} onPress={() => void link()} />
        <Button title={t('auth.google.linkCancel')} secondary disabled={busy}
          onPress={() => { setLinkToken(null); setError(''); }} />
      </View>
    );

  return (
    <View style={{ gap: 14 }}>
      <Button title={t('auth.google.continue')} icon="logo-google" secondary loading={busy}
        onPress={() => void start()} />
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      <Text style={[ui.caption, { textAlign: 'center' }]}>{t('auth.google.orEmail')}</Text>
    </View>
  );
}
