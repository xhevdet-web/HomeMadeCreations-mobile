import { Text } from 'react-native';
import { Button, useUI } from '@/components/common/ui';
import { useAuthStore } from '@/store/authStore';

// Inline form error, plus the saved-session error left behind by a failed sign out.
export function AuthFeedback({ error }: { error: string }) {
  const ui = useUI();
  const sessionError = useAuthStore((state) => state.error);
  const message = error || sessionError;
  return (
    <>
      {message ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {message}
        </Text>
      ) : null}
      {sessionError?.startsWith('Could not clear') ? (
        <Button
          title="Retry clearing saved session"
          secondary
          onPress={() => {
            void useAuthStore.getState().logout();
          }}
        />
      ) : null}
    </>
  );
}
