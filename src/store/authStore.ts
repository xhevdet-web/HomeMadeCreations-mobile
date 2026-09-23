import { create } from 'zustand';
import type { User } from '../types/models';
import { authApi, parseTokens, type Tokens } from '../services/authApi';
import { authStorage } from '../services/authStorage';

interface AuthState {
  user: User | null;
  status: 'checking' | 'authenticated' | 'anonymous';
  expiresAt: number | null;
  error: string | null;
  restore: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userName?: string;
    phone?: string;
    country?: string;
    address?: string;
    postalCode?: string;
  }) => Promise<void>;
  update: (user: User) => void;
  logout: () => Promise<void>;
}
let generation = 0;
let restoring: Promise<void> | null = null;
let storageQueue: Promise<unknown> = Promise.resolve();
function stored<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(operation);
  storageQueue = result.catch(() => undefined);
  return result;
}
async function validate(tokens: Tokens) {
  if (tokens.expiresAt <= Date.now()) throw new Error('Session expired.');
  const user = await authApi.me(tokens.accessToken);
  if (tokens.expiresAt <= Date.now()) throw new Error('Session expired.');
  return user;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'checking',
  expiresAt: null,
  error: null,
  restore: () => {
    if (restoring) return restoring;
    const current = ++generation;
    set({ status: 'checking' });
    restoring = (async () => {
      try {
        const raw = await stored(authStorage.read);
        if (!raw) {
          if (current === generation) set({ user: null, status: 'anonymous', expiresAt: null });
          return;
        }
        const tokens = parseTokens(JSON.parse(raw));
        const user = await validate(tokens);
        if (current === generation)
          set({ user, status: 'authenticated', expiresAt: tokens.expiresAt, error: null });
      } catch {
        if (current !== generation) return;
        await stored(authStorage.clear).catch(() => undefined);
        if (current === generation)
          set({
            user: null,
            status: 'anonymous',
            expiresAt: null,
            error: 'Please sign in to continue.',
          });
      } finally {
        restoring = null;
      }
    })();
    return restoring;
  },
  signIn: async (identifier, password) => {
    const current = ++generation;
    set({ error: null });
    const tokens = await authApi.login(identifier, password);
    const user = await validate(tokens);
    if (current !== generation) return;
    await stored(async () => {
      if (current === generation) await authStorage.write(JSON.stringify(tokens));
    });
    if (current === generation) set({ user, status: 'authenticated', expiresAt: tokens.expiresAt });
  },
  register: async (input) => {
    await authApi.register(input);
    // Registration creates an account only; it never grants a simulated session.
  },
  update: (user) => {
    if (get().user?.id === user.id) set({ user });
  },
  logout: async () => {
    ++generation;
    // Lock routing immediately, even if secure storage takes time or fails.
    set({ user: null, status: 'anonymous', expiresAt: null, error: null });
    try {
      await stored(authStorage.clear);
    } catch {
      set({
        error:
          'Could not clear the saved session. Please retry signing out before closing the app.',
      });
    }
  },
}));
