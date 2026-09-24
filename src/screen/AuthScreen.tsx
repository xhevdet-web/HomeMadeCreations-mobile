import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Field, IconButton, Page, useUI } from '@/components/common/ui';
import { PasswordInput } from '@/components/common/PasswordInput';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

import { hasRequiredValues, isValidEmail } from '@/helper/validation';

export function AuthScreen({ register = false }: { register?: boolean }) {
  const theme = useTheme();
  const ui = useUI();
  const toggleTheme = useThemeStore((state) => state.toggle);
  useEffect(() => { useOnboardingStore.getState().complete(); }, []);

  const { next } = useLocalSearchParams<{ next?: string }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const sessionError = useAuthStore((state) => state.error);
  async function submit() {
    if (busy) return;
    setError('');
    setMessage('');
    if (register && !isValidEmail(email)) return setError('Please enter a valid email address.');
    if (!register && !email.trim()) return setError('Please enter your email or username.');
    if (register && userName.trim() && !/^[a-zA-Z0-9_.-]{3,30}$/.test(userName.trim()))
      return setError(
        'Username must be 3?30 characters: letters, numbers, dots, underscores or hyphens.',
      );
    if (!password) return setError('Please enter your password.');
    if (register) {
      if (password.length < 12 || password.length > 128)
        return setError('Please use a password between 12 and 128 characters.');
      if (!hasRequiredValues(firstName, lastName))
        return setError('Please complete your first and last name.');
      if (password !== confirm) return setError('Your passwords do not match.');
    }
    setBusy(true);
    try {
      if (register) {
        await useAuthStore.getState().register({
          firstName,
          lastName,
          email,
          password,
          userName,
          phone,
          country,
          address,
          postalCode,
        });
        setPassword('');
        setConfirm('');
        setMessage('Account created. You can now sign in.');
      } else {
        await useAuthStore.getState().signIn(email, password);
        setPassword('');
        // The protected navigator opens Home once the session is authenticated.
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page style={{ maxWidth: 460, gap: 22, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconButton name="arrow-back" label={register ? "Back to login" : "Go to registration"} onPress={() => router.replace(register ? '/login' : '/register')} />
        <IconButton name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
          label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggleTheme} />
      </View>
      <View style={{ alignItems: 'center', paddingVertical: register ? 8 : 36 }}><Brand /></View>
      <View style={{ alignItems: register ? 'flex-start' : 'center', gap: 6 }}>
        <Text style={[ui.title, { fontSize: register ? 35 : 28, lineHeight: 38 }]}>{register ? 'Create Account' : 'Welcome back!'}</Text>
        <Text style={ui.body}>{register ? 'Join our creative community' : 'Sign in to continue creating'}</Text>
      </View>
      <View style={{ gap: 18 }}>
        {register && (
          <>
            <Field
              label="First name"
              icon="person-outline"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
            />
            <Field
              label="Last name"
              icon="person-outline"
              value={lastName}
              onChangeText={setLastName}
              autoComplete="family-name"
            />
          </>
        )}
        <Field
          label={register ? 'Email address' : 'Email or username'}
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType={register ? 'email-address' : 'default'}
          autoCapitalize="none"
          autoComplete={register ? 'email' : 'username'}
          autoCorrect={false}
        />
        {register && (
          <>
            <Field
              label="Username (optional)"
              icon="at-outline"
              placeholder="3?30 letters, numbers, dots, _ or -"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              maxLength={30}
            />
            <Field
              label="Phone (optional)"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={32}
            />
            <Field
              label="Country (optional)"
              icon="globe-outline"
              value={country}
              onChangeText={setCountry}
              autoComplete="country"
              maxLength={100}
            />
            <Field
              label="Address (optional)"
              icon="home-outline"
              value={address}
              onChangeText={setAddress}
              autoComplete="street-address"
              maxLength={300}
            />
            <Field
              label="Postal code (optional)"
              icon="location-outline"
              value={postalCode}
              onChangeText={setPostalCode}
              autoComplete="postal-code"
              maxLength={20}
            />
          </>
        )}
        <PasswordInput
          label="Password"
          placeholder={register ? 'At least 12 characters' : 'Your password'}
          value={password}
          onChangeText={setPassword}
          autoComplete={register ? 'new-password' : 'current-password'}
        />
        {register && (
          <PasswordInput
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            />
        )}
        {error || sessionError ? (
          <Text accessibilityRole="alert" style={ui.error}>
            {error || sessionError}
          </Text>
        ) : null}
        {sessionError?.startsWith('Could not clear') ? (
          <Button
            title="Retry clearing saved session"
            secondary
            onPress={() => {
              void useAuthStore.getState().logout();
            }}
          />
        ) : null}
        {message ? (
          <Text accessibilityRole="alert" style={ui.body}>
            {message}
          </Text>
        ) : null}
        <Button
          loading={busy}
          title={register ? 'Create Account' : 'Log In'}
          icon="arrow-forward"
          onPress={submit}
        />
      </View>
      <Pressable
        onPress={() =>
          router.replace({ pathname: register ? '/login' : '/register', params: { next } })
        }
      >
        <Text style={[ui.body, { textAlign: 'center' }]}>
          {register ? 'Already have an account? ' : "Don't have an account? "}
          <Text style={{ color: theme.colors.accent }}>
            {register ? 'Log In' : 'Sign Up'}
          </Text>
        </Text>
      </Pressable>
    </Page>
  );
}
