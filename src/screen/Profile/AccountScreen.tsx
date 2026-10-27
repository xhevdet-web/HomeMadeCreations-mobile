import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import { ProfileForm } from './components/ProfileForm';

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  return (
    <Page style={{ gap: 18 }}>
      <Header title={t('profile.personalDetails')} back />
      {user ? (
        <ProfileForm key={user.id} user={user} />
      ) : (
        <Button title={t('profile.signIn')} onPress={() => router.push('/login')} />
      )}
    </Page>
  );
}
