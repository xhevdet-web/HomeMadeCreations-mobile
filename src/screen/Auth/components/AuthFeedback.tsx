import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';

// Inline form error, plus the saved-session error left behind by a failed sign out.
export function AuthFeedback({ error }: { error: string }) {
  const ui = useUI();
  const { t } = useTranslation();
  const sessionError = useAuthStore((state) => state.error);
  const message = error || (sessionError ? t(sessionError) : '');
  return (
    <>
      {message ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {message}
        </Text>
      ) : null}
      {sessionError === 'auth.session.clearFailed' ? (
        <Button
          title={t('auth.session.retryClear')}
          secondary
          onPress={() => {
            void useAuthStore.getState().logout();
          }}
        />
      ) : null}
    </>
  );
}
