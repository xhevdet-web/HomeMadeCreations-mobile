import i18n from '@/i18n';
import { apiError } from '@/api/apiSlice';
import type { RegistrationInput } from '@/api/endpoints/authSlice';
import { hasRequiredValues, isValidEmail } from '@/helper/validation';
import { meetsPasswordPolicy, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/helper/passwordPolicy';

// Validators run when a form is submitted, so messages use the current language.
const t = i18n.t.bind(i18n);
const lengths = { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH };

export interface RegistrationForm extends Required<RegistrationInput> {
  confirm: string;
}

export const emptyRegistration: RegistrationForm = {
  firstName: '', lastName: '', email: '', password: '', confirm: '',
};

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return t('validation.emailRequired');
  if (!isValidEmail(email)) return t('validation.invalidEmail');
  if (!password) return t('validation.passwordRequired');
  return null;
}

export function validateRegistration(form: RegistrationForm): string | null {
  if (!hasRequiredValues(form.firstName, form.lastName)) return t('validation.nameRequired');
  if (!isValidEmail(form.email)) return t('validation.invalidEmail');
  if (!form.password) return t('validation.passwordRequired');
  if (!meetsPasswordPolicy(form.password)) return t('validation.passwordLength', lengths);
  if (form.password !== form.confirm) return t('validation.passwordsDoNotMatch');
  return null;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Same rules as the API; the first problem, or null when the change can be sent. */
export function validatePasswordChange(form: PasswordChange): string | null {
  if (!form.currentPassword) return t('validation.currentPasswordRequired');
  if (!form.newPassword) return t('validation.newPasswordRequired');
  if (!form.confirmPassword) return t('validation.confirmPasswordRequired');
  if (!meetsPasswordPolicy(form.newPassword)) return t('validation.newPasswordLength', lengths);
  if (form.newPassword !== form.confirmPassword) return t('validation.newPasswordsDoNotMatch');
  if (form.newPassword === form.currentPassword) return t('validation.samePassword');
  return null;
}

export function loginErrorMessage(failure: unknown): string {
  const error = apiError(failure);
  return error.status === 401 ? t('auth.login.invalidCredentials') : error.message;
}

export function registrationErrorMessage(failure: unknown): string {
  const error = apiError(failure);
  if (error.status === 409) return t('auth.register.emailTaken');
  return error.message;
}

// The API answers in English; its known password-change errors are shown translated.
const PASSWORD_CHANGE_ERRORS: Record<string, () => string> = {
  'Current password is incorrect': () => t('validation.currentPasswordIncorrect'),
  'New passwords do not match': () => t('validation.newPasswordsDoNotMatch'),
  'New password must be different from your current password': () => t('validation.samePassword'),
  'New password does not meet the password requirements': () => t('validation.newPasswordLength', lengths),
  'This account signs in with Google and has no password': () => t('validation.googleOnlyPassword'),
};

export function passwordChangeErrorMessage(failure: unknown): string {
  const error = apiError(failure);
  if (error.status === 401) return t('errors.sessionExpired');
  return PASSWORD_CHANGE_ERRORS[error.message]?.() ?? error.message;
}
