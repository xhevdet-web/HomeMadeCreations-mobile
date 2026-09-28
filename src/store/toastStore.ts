import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';
type Toast = { id: number; message: string; kind: ToastKind };
let sequence = 0;
export const useToastStore = create<{
  current: Toast | null;
  show: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}>((set) => ({
  current: null,
  show: (message, kind = 'info') => {
    if (message.trim()) set({ current: { id: ++sequence, message, kind } });
  },
  dismiss: (id) => set(state => state.current?.id === id ? { current: null } : state),
}));
export const toast = {
  info: (message: string) => useToastStore.getState().show(message, 'info'),
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
};
