import { apiSlice } from '../apiSlice';
import { USER_URL } from '../constants';
import { parseUser } from '@/api/authModels';
import type { DeliveryInput } from '@/api/commerceModels';
import type { User } from '@/types/models';

export const userSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** The signed-in user's own profile, including the in-app notification preference. */
    updateProfile: builder.mutation<User, DeliveryInput & { notificationsEnabled?: boolean }>({
      query: (body) => ({ url: `${USER_URL}/me`, method: 'PATCH', body, auth: true }),
      transformResponse: parseUser,
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useUpdateProfileMutation } = userSlice;
