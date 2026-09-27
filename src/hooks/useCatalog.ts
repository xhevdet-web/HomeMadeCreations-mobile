import { useEffect, useState } from 'react';

export function useCatalog<T>(load: (signal: AbortSignal) => Promise<T[]>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    load: typeof load;
    attempt: number;
    data: T[];
    error: string;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ load, attempt, data, error: '' });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            load,
            attempt,
            data: [],
            error:
              error instanceof Error ? error.message : 'Unable to load the catalog. Please retry.',
          });
      },
    );
    return () => controller.abort();
  }, [load, attempt]);
  const current = result?.load === load && result.attempt === attempt ? result : null;
  return {
    data: current?.data ?? [],
    loading: !current,
    error: current?.error ?? '',
    retry: () => setAttempt((value) => value + 1),
  };
}
