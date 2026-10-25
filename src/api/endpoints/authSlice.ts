import { apiSlice } from '../apiSlice';
import { AUTH_URL } from '../constants';
import { parseTokens, parseUser, type Tokens } from '@/api/authModels';
import type { User } from '@/types/models';

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName?: string;
  phone?: string;
  country?: string;
  address?: string;
  postalCode?: string;
}

export const authSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<Tokens, { identifier: string; password: string }>({
      query: ({ identifier, password }) => ({
        url: `${AUTH_URL}/login`, method: 'POST',
        body: { identifier: identifier.trim().toLowerCase(), password },
      }),
      transformResponse: parseTokens,
      invalidatesTags: ['Auth'],
    }),
    // Public self-registration; the backend always creates a CUSTOMER account.
    register: builder.mutation<unknown, RegistrationInput>({
      query: (input) => ({
        url: `${AUTH_URL}/register`, method: 'POST',
        body: {
          firstName: input.firstName.trim(), lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(), password: input.password,
          userName: input.userName?.trim().toLowerCase() || undefined,
          phone: input.phone?.trim() || undefined, country: input.country?.trim() || undefined,
          address: input.address?.trim() || undefined, postalCode: input.postalCode?.trim() || undefined,
        },
      }),
    }),
    // The API identifies the user from the access token; passwords go in the body only.
    changePassword: builder.mutation<{ message: string }, {
      currentPassword: string; newPassword: string; confirmPassword: string;
    }>({
      query: (body) => ({ url: `${AUTH_URL}/change-password`, method: 'PATCH', auth: true, body }),
    }),
    getMe: builder.query<User, string>({
      query: (token) => ({ url: `${AUTH_URL}/me`, token }),
      transformResponse: parseUser,
      providesTags: ['Auth', 'User'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useChangePasswordMutation, useGetMeQuery } = authSlice;
