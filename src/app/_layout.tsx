import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Appearance, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHydration } from '@/hooks/useHydration';
export default function RootLayout() {
  const theme = useTheme();

  const ready = useHydration();
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
          />
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
