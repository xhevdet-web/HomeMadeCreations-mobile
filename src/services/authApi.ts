import type { User } from '../types/models';

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!baseUrl)
    throw new Error(
      'The app cannot connect to the account service. Please check the API configuration.',
    );
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(baseUrl + path, {
      ...init,
      signal: abort.signal,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
    if (!response.ok) {
      if (response.status === 401)
        throw new Error(
          'Your email, username or password is incorrect, or your session has expired.',
        );
      if (response.status === 409) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(
          body?.message === 'Username is already in use'
            ? 'This username is already taken.'
            : 'This email already has an account.',
        );
      }
      if (response.status === 400) {
        const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
        const messages = body?.message;
        if (Array.isArray(messages) && messages.every((message) => typeof message === 'string'))
          throw new Error(messages.join(' '));
        throw new Error('Please check your account details and try again.');
      }
      throw new Error('The account service is unavailable. Please try again later.');
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error('The account request timed out. Check your connection and try again.');
    if (error instanceof TypeError)
      throw new Error(
        'Cannot reach the account service. Check your connection and make sure the API is running.',
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseTokens(value: unknown): Tokens {
  if (!value || typeof value !== 'object') throw new Error('Invalid sign-in response.');
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
    throw new Error('Your session has expired. Please sign in again.');
  if (data.refreshToken !== undefined && typeof data.refreshToken !== 'string')
    throw new Error('Invalid sign-in response.');
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken as string | undefined,
    expiresAt,
  };
}

export function parseUser(value: unknown): User {
  if (!value || typeof value !== 'object') throw new Error('Invalid account response.');
  const data = value as Record<string, unknown>;
  for (const field of ['id', 'firstName', 'lastName', 'email'])
    if (typeof data[field] !== 'string' || !data[field])
      throw new Error('Invalid account response.');
  if (data.isActive === false) throw new Error('Your account is inactive.');
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

export const authApi = {
  login: async (identifier: string, password: string) =>
    parseTokens(
      await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim().toLowerCase(), password }),
      }),
    ),
  me: async (accessToken: string) =>
    parseUser(
      await request('/auth/me', {
        headers: { Authorization: 'Bearer ' + accessToken },
      }),
    ),
  register: async (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userName?: string;
    phone?: string;
    country?: string;
    address?: string;
    postalCode?: string;
  }) => {
    await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        userName: input.userName?.trim().toLowerCase() || undefined,
        phone: input.phone?.trim() || undefined,
        country: input.country?.trim() || undefined,
        address: input.address?.trim() || undefined,
        postalCode: input.postalCode?.trim() || undefined,
      }),
    });
  },
};
