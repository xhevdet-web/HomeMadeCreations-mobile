import { apiSlice } from '../apiSlice';
import { ORDER_URL } from '../constants';
import type { ApiOrder, OrderPage } from '@/api/commerceModels';

export const orderSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<OrderPage, number>({
      query: (page) => ({ url: ORDER_URL, params: { page, limit: 20 }, auth: true }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<ApiOrder, string>({
      query: (id) => ({ url: `${ORDER_URL}/${encodeURIComponent(id)}`, auth: true }),
      providesTags: ['Order'],
    }),
    /** `size` is required for a company product sold in sizes; designs keep their own. */
    createOrder: builder.mutation<ApiOrder, { productId: string; notes: string; size?: string | null }>({
      query: ({ productId, notes, size }) => ({
        url: ORDER_URL,
        method: 'POST',
        auth: true,
        body: { productId, paymentType: 'CASH_ON_DELIVERY', ...(size ? { size } : {}),
          ...(notes.trim() ? { customerNotes: notes.trim() } : {}) },
      }),
      invalidatesTags: ['Order', 'Product', 'SubCategory'],
    }),
  }),
});

export const { useGetOrdersQuery, useLazyGetOrdersQuery, useGetOrderByIdQuery, useCreateOrderMutation } = orderSlice;
