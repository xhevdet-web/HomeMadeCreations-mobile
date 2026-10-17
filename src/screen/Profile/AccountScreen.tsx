import { router } from 'expo-router';
import { Button, Header, Page } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';
import { ProfileForm } from './components/ProfileForm';

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  return (
    <Page style={{ gap: 18 }}>
      <Header title="Personal details" back />
      {user ? (
        <ProfileForm key={user.id} user={user} />
      ) : (
        <Button title="Sign in" onPress={() => router.push('/login')} />
      )}
    </Page>
  );
}
