import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/models';
import { uniqueId } from '@/helper/design';
import { storage } from './storage';

interface AuthState {
  user: User | null;
  profiles: User[];
  signIn: (email: string) => boolean;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
  }) => boolean;
  update: (user: User) => void;
  logout: () => void;
}
// Local identity simulation. Passwords are validated in the form, never stored.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profiles: [],
      signIn: (email) => {
        const user = get().profiles.find(
          (profile) => profile.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!user) return false;
        set({ user });
        return true;
      },
      register: (input) => {
        if (
          get().profiles.some(
            (profile) => profile.email.toLowerCase() === input.email.trim().toLowerCase(),
          )
        )
          return false;
        const id = uniqueId();
        const user: User = {
          id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(),
          address: {
            id: uniqueId(),
            userId: id,
            fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
            street: input.address.trim(),
            city: '',
            postalCode: '',
            country: '',
          },
        };
        set({ user, profiles: [...get().profiles, user] });
        return true;
      },
      update: (user) =>
        set({
          user,
          profiles: get().profiles.map((profile) => (profile.id === user.id ? user : profile)),
        }),
      logout: () => set({ user: null }),
    }),
    { name: 'homemade-profile-v1', storage },
  ),
);
