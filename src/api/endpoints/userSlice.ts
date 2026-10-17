import { apiSlice } from '../apiSlice';
import { USER_URL } from '../constants';
import { parseUser } from '@/api/authModels';
import type { DeliveryInput } from '@/api/commerceModels';
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

export const userSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<unknown, RegistrationInput>({
      query: (input) => ({
        url: USER_URL, method: 'POST',
        body: {
          firstName: input.firstName.trim(), lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(), password: input.password,
          userName: input.userName?.trim().toLowerCase() || undefined,
          phone: input.phone?.trim() || undefined, country: input.country?.trim() || undefined,
          address: input.address?.trim() || undefined, postalCode: input.postalCode?.trim() || undefined,
        },
      }),
      invalidatesTags: ['User'],
    }),
    updateProfile: builder.mutation<User, DeliveryInput>({
      query: (body) => ({ url: `${USER_URL}/me`, method: 'PATCH', body, auth: true }),
      transformResponse: parseUser,
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useCreateUserMutation, useUpdateProfileMutation } = userSlice;
