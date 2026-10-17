import { apiSlice } from '../apiSlice';
import { AUTH_URL } from '../constants';
import { parseTokens, parseUser, type Tokens } from '@/api/authModels';
import type { User } from '@/types/models';

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
    getMe: builder.query<User, string>({
      query: (token) => ({ url: `${AUTH_URL}/me`, token }),
      transformResponse: parseUser,
      providesTags: ['Auth', 'User'],
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery } = authSlice;
