import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Field, Header, Page, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';

import { hasRequiredValues, isValidEmail } from '@/helper/validation';

export function AuthScreen({ register = false }: { register?: boolean }) {
  const theme = useTheme();
  const ui = useUI();

  const { next } = useLocalSearchParams<{ next?: string }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  function submit() {
    if (!isValidEmail(email)) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Please use a password with at least 8 characters.');
    if (register) {
      if (!hasRequiredValues(firstName, lastName, address))
        return setError('Please complete your name and home address.');
      if (password !== confirm) return setError('Your passwords do not match.');
      if (!useAuthStore.getState().register({ firstName, lastName, email, address }))
        return setError('This email already has a local profile. Please sign in.');
    } else if (!useAuthStore.getState().signIn(email))
      return setError('No local profile found. Create an account to get started.');
    if (next === 'checkout') router.dismissTo('/checkout');
    else router.replace('/');
  }
  return (
    <Page>
      <Header title="Your little creative corner" back />
      <View style={{ alignItems: 'center', paddingVertical: 18 }}>
        <Brand />
      </View>
      <View>
        <Text style={ui.eyebrow}>
          {register ? 'LET’S MAKE SOMETHING MEANINGFUL' : 'A LITTLE TIME FOR YOU'}
        </Text>
        <Text style={ui.title}>{register ? 'A new story begins.' : 'Welcome back.'}</Text>
        <Text style={[ui.body, { marginTop: 12 }]}>
          {register
            ? 'Save your creations and bring your ideas to life.'
            : 'Your ideas, your favorites, your next creation.'}
        </Text>
      </View>
      <View style={{ gap: 18 }}>
        {register && (
          <>
            <Field
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
            />
            <Field
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoComplete="family-name"
            />
          </>
        )}
        <Field
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {register && (
          <Field
            label="Home address"
            value={address}
            onChangeText={setAddress}
            autoComplete="street-address"
            multiline
          />
        )}
        <Field
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? 'new-password' : 'current-password'}
        />
        {register && (
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        )}
        {error ? (
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
        ) : null}
        <Button
          title={register ? 'Create my account' : 'Sign in'}
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
          {register ? 'Already part of the story? ' : 'New to HomeMade? '}
          <Text style={{ color: theme.colors.accent }}>
            {register ? 'Sign in' : 'Create an account'}
          </Text>
        </Text>
      </Pressable>
      <Text style={[ui.caption, { textAlign: 'center' }]}>
        Prototype account · stored on this device only.{'\n'}Sign-in is simulated: any 8-character
        password works for an existing local profile. Passwords are never saved.
      </Text>
      <Pressable onPress={() => router.replace('/')}>
        <Text style={[ui.textLink, { textAlign: 'center' }]}>Explore the collection first</Text>
      </Pressable>
    </Page>
  );
}
