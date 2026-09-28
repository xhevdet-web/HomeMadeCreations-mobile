import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { toast } from '@/store/toastStore';
export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const userRequested = useRef(false);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      void attempt; // Explicit refresh requests restart this focus-scoped fetch.
      const buttonRequest = userRequested.current;
      userRequested.current = false;
      const controller = new AbortController();
      // Focus callbacks also run when returning from another route.
      Promise.resolve()
        .then(() => {
          if (!controller.signal.aborted) setResult({ loading: true });
          return load(controller.signal);
        })
        .then(
          (data) => {
            if (!controller.signal.aborted) {
              if (buttonRequest) toast.success('Refreshed. You can continue with the updated details.');
              setResult({ data, loading: false });
            }
          },
          (error) => {
            if (!controller.signal.aborted) {
              if (buttonRequest) toast.error((error instanceof Error ? error.message : 'Unable to load data.') + ' Use Retry or Refresh to try loading again.');
              setResult({
                error: error instanceof Error ? error.message : 'Unable to load data.',
                loading: false,
              });
            }
          },
        );
      return () => controller.abort();
    }, [load, attempt]),
  );
  return { ...result, retry: () => { userRequested.current = true; setAttempt((n) => n + 1); } };
}
