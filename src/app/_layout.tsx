import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, Appearance, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useHydration } from '@/hooks/useHydration';
export default function RootLayout() {
  const theme = useTheme();

  const hydrated = useHydration();
  const status = useAuthStore((state) => state.status);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const completed = useOnboardingStore((state) => state.completed);
  const ready = hydrated && status !== 'checking';
  useEffect(() => {
    void useAuthStore.getState().restore();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useAuthStore.getState().status === 'authenticated')
        void useAuthStore.getState().restore();
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!expiresAt || status !== 'authenticated') return;
    const timer = setTimeout(
      () => {
        void useAuthStore.getState().restore();
      },
      Math.min(Math.max(0, expiresAt - Date.now()), 2147483647),
    );
    return () => clearTimeout(timer);
  }, [expiresAt, status]);
  useEffect(() => {
    if (ready && Platform.OS !== 'web') Appearance.setColorScheme(theme.mode);
  }, [ready, theme.mode]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        {ready ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Protected guard={status === 'anonymous'}>
              <Stack.Protected guard={!completed}>
                <Stack.Screen name="welcome" />
              </Stack.Protected>
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
            </Stack.Protected>
            <Stack.Protected guard={status === 'authenticated'}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="categories" />
              <Stack.Screen name="products" />
              <Stack.Screen name="components" />
              <Stack.Screen name="details" />
              <Stack.Screen name="designer" />
              <Stack.Screen name="preview" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="confirmation" />
            </Stack.Protected>
          </Stack>
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.background,
            }}
          >
            <ActivityIndicator
              color={theme.colors.accent}
              accessibilityLabel="Opening your studio"
            />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
