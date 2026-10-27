import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { fetch } from 'expo/fetch';
import { authStorage } from '@/services/authStorage';
import { parseTokens } from '@/api/authModels';
import { errorText, type ClientErrorCode } from '@/api/errorText';

/** A server message, or a `code` for problems the app detects (shown in the user's language). */
export interface ApiFailure {
  status: number;
  message: string;
  code?: ClientErrorCode;
}

export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

export function apiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const failure = error as ApiFailure;
    return new ApiError(failure.code ? errorText(failure.code, failure.status) : failure.message, failure.status);
  }
  return new ApiError(error instanceof Error ? error.message : errorText('requestFailed'));
}

export interface ApiRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  auth?: boolean;
  token?: string;
}

const baseQuery: BaseQueryFn<ApiRequest, unknown, ApiFailure> = async (args, api) => {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!base) return { error: { status: 0, code: 'notConfigured', message: '' } };
  let token = args.token;
  if (args.auth && !token) {
    try {
      const raw = await authStorage.read();
      if (!raw) throw new Error('Missing session');
      token = parseTokens(JSON.parse(raw)).accessToken;
    } catch {
      return { error: { status: 401, code: 'sessionExpired', message: '' } };
    }
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  api.signal.addEventListener('abort', cancel);
  if (api.signal.aborted) cancel();
  const timer = setTimeout(cancel, args.body instanceof FormData ? 45000 : 15000);
  try {
    const url = new URL(base + args.url);
    for (const [key, value] of Object.entries(args.params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetch(url.toString(), {
      method: args.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(args.body === undefined || args.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: args.body === undefined ? undefined : args.body instanceof FormData ? args.body : JSON.stringify(args.body),
    });
    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return { error: { status: response.status, message: '',
        code: response.ok ? 'invalidResponse' : 'serverError' } };
    }
    if (!response.ok) {
      const body = data as { message?: unknown } | null;
      const message = body?.message;
      // Server messages are shown as sent; the API is not localized.
      if (Array.isArray(message)) return { error: { status: response.status, message: message.map(String).join(' ') } };
      if (typeof message === 'string') return { error: { status: response.status, message } };
      return { error: { status: response.status, code: 'requestFailed', message: '' } };
    }
    return { data };
  } catch {
    return { error: { status: 0, code: controller.signal.aborted ? 'timeout' : 'unreachable', message: '' } };
  } finally {
    clearTimeout(timer);
    api.signal.removeEventListener('abort', cancel);
  }
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Auth', 'Category', 'SubCategory', 'Product', 'Order', 'User'],
  endpoints: () => ({}),
});
