import { apiSlice } from '../apiSlice';
import { AUTH_URL } from '../constants';
import { parseTokens, parseUser, type Tokens } from '@/api/authModels';
import type { User } from '@/types/models';

// Delivery details are not asked at sign-up; checkout collects them on the profile.
export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Customers sign in with their email only.
    login: builder.mutation<Tokens, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: `${AUTH_URL}/login`, method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      }),
      transformResponse: parseTokens,
      invalidatesTags: ['Auth'],
    }),
    // Sign-in and sign-up with Google: the API verifies the ID token and answers like login.
    // 409 means the email already has a password account; send its password to link Google.
    googleLogin: builder.mutation<{ tokens: Tokens; profileComplete: boolean }, { idToken: string; password?: string }>({
      query: ({ idToken, password }) => ({
        url: `${AUTH_URL}/google`, method: 'POST', body: { idToken, password },
      }),
      transformResponse: (data: unknown) => ({
        tokens: parseTokens(data),
        profileComplete: (data as { profileComplete?: unknown } | null)?.profileComplete !== false,
      }),
      invalidatesTags: ['Auth'],
    }),
    // Public self-registration; the backend always creates a CUSTOMER account.
    register: builder.mutation<unknown, RegistrationInput>({
      query: (input) => ({
        url: `${AUTH_URL}/register`, method: 'POST',
        body: {
          firstName: input.firstName.trim(), lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(), password: input.password,
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

export const { useLoginMutation, useGoogleLoginMutation, useRegisterMutation, useChangePasswordMutation, useGetMeQuery } = authSlice;
