import { apiSlice } from '../apiSlice';
import { CONTACT_URL } from '../constants';

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderNumber?: string;
}

export const contactSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Delivered by the API to the HomeMade Creator inbox; replies go to `email`.
    sendContactMessage: builder.mutation<{ success: boolean; message: string }, ContactMessageInput>({
      query: (body) => ({ url: CONTACT_URL, method: 'POST', body }),
    }),
  }),
});

export const { useSendContactMessageMutation } = contactSlice;
