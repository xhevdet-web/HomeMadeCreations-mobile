import { Pressable, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Icon, Page, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { toast } from '@/store/toastStore';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/store/languageStore';
import { ProfileForm } from './components/ProfileForm';
import { ProfileHeader } from './components/ProfileHeader';
import { SettingsRow, SettingsSection } from './components/Settings';
import type { IconName } from '@/components/common/ui';
import type { Href } from 'expo-router';

// Rows hold translation keys; the text is translated when the screen renders.
const support: { icon: IconName; title: 'profile.help' | 'profile.contact' | 'profile.terms' | 'profile.privacy'; href: Href }[] = [
  { icon: 'help-circle-outline', title: 'profile.help', href: '/help' },
  { icon: 'chatbubble-ellipses-outline', title: 'profile.contact', href: '/contact' },
  { icon: 'document-text-outline', title: 'profile.terms', href: '/terms' },
  { icon: 'shield-checkmark-outline', title: 'profile.privacy', href: '/privacy' },
];

export default function ProfileScreen() {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const user = useAuthStore((state) => state.user);
  // Notifications have no backend support yet, so the row stays marked Soon.
  const comingSoon = (feature: string) => toast.info(t('profile.comingSoon', { feature }));
  const toggleTheme = useThemeStore((state) => state.toggle);
  const { next } = useLocalSearchParams<{ next?: string }>();
  const editDetails = () => router.push('/account');

  // Checkout sends customers here to finish delivery details, then returns them.
  if (next === 'checkout')
    return (
      <Page style={{ gap: 18 }}>
        <Header title={t('profile.deliveryDetails')} back />
        {user ? (
          <ProfileForm key={user.id} user={user} returnToCheckout />
        ) : (
          <Button title={t('profile.signIn')} onPress={() => router.push('/login')} />
        )}
      </Page>
    );

  if (!user)
    return (
      <Page>
        <Header title={t('profile.title')} />
        <Button title={t('profile.signIn')} onPress={() => router.push('/login')} />
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
      <Header title={t('profile.title')} />
      <ProfileHeader user={user} onEdit={editDetails} />

      {missingDelivery && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.completeDelivery')}
          onPress={editDetails}
          style={[ui.notice, { backgroundColor: theme.colors.soft }]}
        >
          <Icon name="alert-circle-outline" size={18} color={theme.colors.accent} />
          <Text style={[ui.caption, { flex: 1, color: theme.colors.text }]}>
            {t('profile.completeDeliveryHint')}
          </Text>
          <Icon name="chevron-forward" size={16} color={theme.colors.muted} />
        </Pressable>
      )}

      <SettingsSection title={t('profile.account')}>
        <SettingsRow
          icon="person-outline"
          title={t('profile.personalDetails')}
          subtitle={user.phone || t('profile.nameAndPhone')}
          onPress={editDetails}
        />
        <SettingsRow
          icon="location-outline"
          title={t('profile.deliveryAddress')}
          subtitle={address || t('profile.notAddedYet')}
          onPress={editDetails}
        />
        <SettingsRow
          icon="lock-closed-outline"
          title={t('profile.changePassword')}
          last
          onPress={() => router.push('/change-password')}
        />
      </SettingsSection>

      <SettingsSection title={t('profile.myActivity')}>
        <SettingsRow
          icon="heart-outline"
          title={t('profile.myDesigns')}
          onPress={() => router.push('/designs')}
        />
        <SettingsRow
          icon="bag-handle-outline"
          title={t('profile.myOrders')}
          last
          onPress={() => router.push('/orders')}
        />
      </SettingsSection>

      <SettingsSection title={t('profile.preferences')}>
        <SettingsRow
          icon={theme.mode === 'dark' ? 'moon' : 'moon-outline'}
          title={t('profile.darkMode')}
          toggle={{ value: theme.mode === 'dark', onChange: toggleTheme }}
        />
        <SettingsRow
          icon="notifications-outline"
          title={t('profile.notifications')}
          soon
          onPress={() => comingSoon(t('profile.notifications'))}
        />
        <SettingsRow
          icon="language-outline"
          title={t('profile.language')}
          value={language === 'sq' ? t('language.albanian') : t('language.english')}
          last
          onPress={() => router.push('/language')}
        />
      </SettingsSection>

      <SettingsSection title={t('profile.support')}>
        {support.map((item, index) => (
          <SettingsRow
            key={item.title}
            icon={item.icon}
            title={t(item.title)}
            last={index === support.length - 1}
            onPress={() => router.push(item.href)}
          />
        ))}
      </SettingsSection>

      <View style={{ gap: 14 }}>
        <SettingsSection title={t('profile.session')}>
          <SettingsRow
            icon="log-out-outline"
            title={t('profile.signOut')}
            danger
            last
            onPress={() => void useAuthStore.getState().logout()}
          />
        </SettingsSection>
        <Text style={[ui.caption, { textAlign: 'center' }]}>
          {t('profile.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
      </View>
    </Page>
  );
}
