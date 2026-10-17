import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Icon, IconName } from '@/components/common/ui';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  designs: { active: 'heart', inactive: 'heart-outline' },
  orders: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};
export default function TabsLayout() {
  const theme = useTheme();
  const c = theme.colors;

  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: c.background },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.navigation,
          borderTopColor: c.border,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 70 + Math.max(insets.bottom, 10),
          shadowColor: '#000',
          shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 12,
        },
        tabBarLabel: ({ focused, color, children }) => (
          <Text
            style={{
              color,
              fontSize: 10,
              marginTop: 4,
              fontWeight: focused ? '700' : '500',
            }}
          >
            {children}
          </Text>
        ),
        tabBarIcon: ({ focused, color }) =>
          route.name === 'create' ? (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                marginTop: -22,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: c.navigation,
                shadowColor: c.primary,
                shadowOpacity: 0.35,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
                transform: [{ scale: focused ? 1.06 : 1 }],
              }}
            >
              <Icon name="add" size={26} color={c.onPrimary} />
            </View>
          ) : (
            <View
              style={{
                width: 54,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? c.soft : 'transparent',
              }}
            >
              <Icon
                name={focused ? icons[route.name].active : icons[route.name].inactive}
                size={21}
                color={color}
              />
            </View>
          ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="designs" options={{ title: 'My Designs' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
