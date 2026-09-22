export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export const hasRequiredValues = (...values: string[]) =>
  values.every((value) => value.trim().length > 0);
