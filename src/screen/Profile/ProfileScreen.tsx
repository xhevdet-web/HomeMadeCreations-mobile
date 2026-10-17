import { Pressable, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Icon, Page, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { toast } from '@/store/toastStore';
import { useTheme } from '@/hooks/useTheme';
import { ProfileForm } from './components/ProfileForm';
import { ProfileHeader } from './components/ProfileHeader';
import { SettingsRow, SettingsSection } from './components/Settings';
import type { IconName } from '@/components/common/ui';

// Placeholders for features without backend support yet. Replace `soon` with a real
// onPress when the endpoint or screen exists.
const preferences: { icon: IconName; title: string; value?: string }[] = [
  { icon: 'notifications-outline', title: 'Notifications' },
  { icon: 'language-outline', title: 'Language', value: 'English' },
];
const support: { icon: IconName; title: string }[] = [
  { icon: 'help-circle-outline', title: 'Help & FAQ' },
  { icon: 'chatbubble-ellipses-outline', title: 'Contact us' },
  { icon: 'document-text-outline', title: 'Terms of service' },
  { icon: 'shield-checkmark-outline', title: 'Privacy policy' },
];
const comingSoon = (title: string) => toast.info(`${title} is coming soon.`);

export default function ProfileScreen() {
  const ui = useUI();
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const toggleTheme = useThemeStore((state) => state.toggle);
  const { next } = useLocalSearchParams<{ next?: string }>();
  const editDetails = () => router.push('/account');

  // Checkout sends customers here to finish delivery details, then returns them.
  if (next === 'checkout')
    return (
      <Page style={{ gap: 18 }}>
        <Header title="Delivery details" back />
        {user ? (
          <ProfileForm key={user.id} user={user} returnToCheckout />
        ) : (
          <Button title="Sign in" onPress={() => router.push('/login')} />
        )}
      </Page>
    );

  if (!user)
    return (
      <Page>
        <Header title="Your profile" />
        <Button title="Sign in" onPress={() => router.push('/login')} />
      </Page>
    );

  const missingDelivery = ![
    user.firstName,
    user.lastName,
    user.phone,
    user.address?.country,
    user.address?.street,
  ].every((value) => value?.trim());
  const address = [user.address?.street, user.address?.postalCode, user.address?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Page style={{ gap: 22 }}>
      <Header title="Your profile" />
      <ProfileHeader user={user} onEdit={editDetails} />

      {missingDelivery && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Complete your delivery details"
          onPress={editDetails}
          style={[ui.notice, { backgroundColor: theme.colors.soft }]}
        >
          <Icon name="alert-circle-outline" size={18} color={theme.colors.accent} />
          <Text style={[ui.caption, { flex: 1, color: theme.colors.text }]}>
            Add your phone and address so you can order in one tap.
          </Text>
          <Icon name="chevron-forward" size={16} color={theme.colors.muted} />
        </Pressable>
      )}

      <SettingsSection title="Account">
        <SettingsRow
          icon="person-outline"
          title="Personal details"
          subtitle={user.phone || 'Name and phone'}
          onPress={editDetails}
        />
        <SettingsRow
          icon="location-outline"
          title="Delivery address"
          subtitle={address || 'Not added yet'}
          onPress={editDetails}
        />
        <SettingsRow
          icon="lock-closed-outline"
          title="Change password"
          soon
          last
          onPress={() => comingSoon('Change password')}
        />
      </SettingsSection>

      <SettingsSection title="My activity">
        <SettingsRow
          icon="heart-outline"
          title="My Designs"
          onPress={() => router.push('/designs')}
        />
        <SettingsRow
          icon="bag-handle-outline"
          title="My Orders"
          last
          onPress={() => router.push('/orders')}
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow
          icon={theme.mode === 'dark' ? 'moon' : 'moon-outline'}
          title="Dark mode"
          toggle={{ value: theme.mode === 'dark', onChange: toggleTheme }}
        />
        {preferences.map((item, index) => (
          <SettingsRow
            key={item.title}
            icon={item.icon}
            title={item.title}
            value={item.value}
            soon
            last={index === preferences.length - 1}
            onPress={() => comingSoon(item.title)}
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Support">
        {support.map((item, index) => (
          <SettingsRow
            key={item.title}
            icon={item.icon}
            title={item.title}
            soon
            last={index === support.length - 1}
            onPress={() => comingSoon(item.title)}
          />
        ))}
      </SettingsSection>

      <View style={{ gap: 14 }}>
        <SettingsSection title="Session">
          <SettingsRow
            icon="log-out-outline"
            title="Sign out"
            danger
            last
            onPress={() => void useAuthStore.getState().logout()}
          />
        </SettingsSection>
        <Text style={[ui.caption, { textAlign: 'center' }]}>
          HomeMade Creator · Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </Page>
  );
}
