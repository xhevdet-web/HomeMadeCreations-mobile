import i18n from '@/i18n';
import type { User } from '../types/models';

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export function parseTokens(value: unknown): Tokens {
  if (!value || typeof value !== 'object') throw new Error(i18n.t('errors.invalidSignIn'));
  const data = value as Record<string, unknown>;
  // The API supplies a lifetime in seconds. Session validity is verified by /auth/me.
  const expiresAt =
    typeof data.expiresAt === 'number'
      ? data.expiresAt
      : typeof data.expiresIn === 'number'
        ? Date.now() + data.expiresIn * 1000
        : NaN;
  if (
    typeof data.accessToken !== 'string' ||
    !data.accessToken ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  )
    throw new Error(i18n.t('errors.sessionExpired'));
  if (data.refreshToken !== undefined && typeof data.refreshToken !== 'string')
    throw new Error(i18n.t('errors.invalidSignIn'));
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken as string | undefined,
    expiresAt,
  };
}

export function parseUser(value: unknown): User {
  if (!value || typeof value !== 'object') throw new Error(i18n.t('errors.invalidAccount'));
  const data = value as Record<string, unknown>;
  for (const field of ['id', 'firstName', 'lastName', 'email'])
    if (typeof data[field] !== 'string' || !data[field])
      throw new Error(i18n.t('errors.invalidAccount'));
  if (data.isActive === false) throw new Error(i18n.t('errors.accountInactive'));
  // Adapt flat API address fields to the existing mobile address model.
  return {
    userName: typeof data.userName === 'string' ? data.userName : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    id: data.id as string,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: data.email as string,
    address: {
      id: '',
      userId: data.id as string,
      fullName: data.firstName + ' ' + data.lastName,
      street: typeof data.address === 'string' ? data.address : '',
      city: '',
      postalCode: typeof data.postalCode === 'string' ? data.postalCode : '',
      country: typeof data.country === 'string' ? data.country : '',
    },
  };
}

