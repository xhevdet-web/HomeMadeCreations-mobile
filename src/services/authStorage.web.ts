// SecureStore is native-only. Never persist bearer tokens in browser storage.
let value: string | null = null;
export const authStorage = {
  read: async () => value,
  write: async (next: string) => {
    value = next;
  },
  clear: async () => {
    value = null;
  },
};
