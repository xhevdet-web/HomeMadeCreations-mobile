import { apiError } from '@/api/apiSlice';
import type { RegistrationInput } from '@/api/endpoints/authSlice';
import { hasRequiredValues, isValidEmail } from '@/helper/validation';
import { meetsPasswordPolicy, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/helper/passwordPolicy';

export interface RegistrationForm extends Required<RegistrationInput> {
  confirm: string;
}

export const emptyRegistration: RegistrationForm = {
  firstName: '', lastName: '', email: '', userName: '', phone: '',
  country: '', address: '', postalCode: '', password: '', confirm: '',
};

const USERNAME = /^[a-zA-Z0-9_.-]{3,30}$/;

export function validateLogin(identifier: string, password: string): string | null {
  if (!identifier.trim()) return 'Please enter your email or username.';
  if (!password) return 'Please enter your password.';
  return null;
}

export function validateRegistration(form: RegistrationForm): string | null {
  if (!hasRequiredValues(form.firstName, form.lastName))
    return 'Please complete your first and last name.';
  if (!isValidEmail(form.email)) return 'Please enter a valid email address.';
  if (form.userName.trim() && !USERNAME.test(form.userName.trim()))
    return 'Username must be 3–30 characters: letters, numbers, dots, underscores or hyphens.';
  if (!form.password) return 'Please enter your password.';
  if (!meetsPasswordPolicy(form.password))
    return `Please use a password between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
  if (form.password !== form.confirm) return 'Your passwords do not match.';
  return null;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Same rules as the API; the first problem, or null when the change can be sent. */
export function validatePasswordChange(form: PasswordChange): string | null {
  if (!form.currentPassword) return 'Please enter your current password.';
  if (!form.newPassword) return 'Please enter a new password.';
  if (!form.confirmPassword) return 'Please confirm your new password.';
  if (!meetsPasswordPolicy(form.newPassword))
    return `Your new password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
  if (form.newPassword !== form.confirmPassword) return 'Your new passwords do not match.';
  if (form.newPassword === form.currentPassword)
    return 'Your new password must be different from your current password.';
  return null;
}

export function loginErrorMessage(failure: unknown): string {
  const error = apiError(failure);
  return error.status === 401
    ? 'Your email, username or password is incorrect, or your session has expired.'
    : error.message;
}

export function registrationErrorMessage(failure: unknown): string {
  const error = apiError(failure);
  if (error.status === 409)
    return error.message === 'Username is already in use'
      ? 'This username is already taken.'
      : 'This email already has an account. Log in instead.';
  return error.message;
}
