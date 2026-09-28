import { useCallback, useState } from 'react';
import { ToastKind, useToastStore } from '@/store/toastStore';

// Keep persistent inline feedback as well as the transient notification.
export function useFeedbackState(kind: ToastKind = 'error') {
  const [message, setMessage] = useState('');
  const update = useCallback((value: string, notificationKind: ToastKind = kind) => {
    setMessage(value);
    if (value) useToastStore.getState().show(value, notificationKind);
  }, [kind]);
  return [message, update, setMessage] as const;
}
