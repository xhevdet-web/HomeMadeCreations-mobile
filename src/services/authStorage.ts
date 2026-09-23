import * as SecureStore from 'expo-secure-store';

const KEY = 'homemade.auth.tokens.v1';
export const authStorage = {
  read: () => SecureStore.getItemAsync(KEY),
  write: (value: string) => SecureStore.setItemAsync(KEY, value),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
