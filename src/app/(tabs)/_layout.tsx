import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { Icon, IconName } from '@/components/common/ui';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
const icons: Record<string, IconName> = {
  index: 'home-outline',
  create: 'add-circle-outline',
  designs: 'heart-outline',
  orders: 'bag-handle-outline',
  profile: 'person-outline',
};
export default function TabsLayout() {
  const theme = useTheme();

  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.navigation,
          borderTopColor: theme.colors.border,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 64 + Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: { fontSize: 10, marginTop: 4 },
        tabBarIcon: ({ color }) => <Icon name={icons[route.name]} size={21} color={color} />,
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
