import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      void attempt; // Explicit refresh requests restart this focus-scoped fetch.
      const controller = new AbortController();
      // Focus callbacks also run when returning from another route.
      Promise.resolve()
        .then(() => {
          if (!controller.signal.aborted) setResult({ loading: true });
          return load(controller.signal);
        })
        .then(
          (data) => {
            if (!controller.signal.aborted) setResult({ data, loading: false });
          },
          (error) => {
            if (!controller.signal.aborted)
              setResult({
                error: error instanceof Error ? error.message : 'Unable to load data.',
                loading: false,
              });
          },
        );
      return () => controller.abort();
    }, [load, attempt]),
  );
  return { ...result, retry: () => setAttempt((n) => n + 1) };
}
