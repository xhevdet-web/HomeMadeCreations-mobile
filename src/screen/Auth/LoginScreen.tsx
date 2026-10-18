import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field, useUI } from '@/components/common/ui';
import { PasswordInput } from '@/components/common/PasswordInput';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useLoginMutation } from '@/api/endpoints/authSlice';
import { loginErrorMessage, validateLogin } from './authForm';
import { AuthLayout } from './components/AuthLayout';
import { AuthFeedback } from './components/AuthFeedback';

export default function LoginScreen() {
  const ui = useUI();
  const { next } = useLocalSearchParams<{ next?: string; registered?: string }>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useFeedbackState();
  const [busy, setBusy] = useState(false);
  const [login, loginState] = useLoginMutation();

  async function submit() {
    if (busy) return;
    setError('');
    const invalid = validateLogin(identifier, password);
    if (invalid) return setError(invalid);
    setBusy(true);
    toast.info('Signing you in. Please wait while we check your account.');
    try {
      const ticket = useAuthStore.getState().beginLogin();
      const tokens = await login({ identifier, password }).unwrap();
      if (!await useAuthStore.getState().acceptLogin(tokens, ticket)) return;
      setPassword('');
      toast.success('Signed in. Next, choose a ready-made product or create your own design.');
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
      title="Welcome back!"
      subtitle="Sign in to pick up your designs and track your orders."
      tagline="Handmade pieces, designed by you"
      backLabel="Go to registration"
      onBack={() => router.replace('/register')}
      switchPrompt="Don't have an account? "
      switchAction="Sign Up"
      onSwitch={() => router.replace({ pathname: '/register', params: { next } })}
    >
      <View style={{ gap: 18 }}>
        <Field
          label="Email or username"
          icon="mail-outline"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Forgot password?" hitSlop={8}
          style={{ alignSelf: 'flex-end', marginTop: -6 }}
          onPress={() => toast.info('Password reset is coming soon. Contact us if you can’t sign in.')}>
          <Text style={ui.textLink}>Forgot password?</Text>
        </Pressable>
        <AuthFeedback error={error} />
        <Button loading={busy} title="Log In" icon="arrow-forward" onPress={submit} />
      </View>
    </AuthLayout>
  );
}
