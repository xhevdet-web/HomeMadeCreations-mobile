import { apiSlice } from '../apiSlice';
import { GIFT_PACKAGING_URL } from '../constants';
import { parsePackagingList, type GiftPackaging } from '@/api/packagingModels';

export const giftPackagingSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Every packaging option; inactive ones are kept so a saved gift can still show its own. */
    getGiftPackaging: builder.query<GiftPackaging[], void>({
      query: () => ({ url: GIFT_PACKAGING_URL }),
      transformResponse: parsePackagingList,
      providesTags: ['GiftPackaging'],
    }),
  }),
});

export const { useGetGiftPackagingQuery } = giftPackagingSlice;
