import { apiSlice } from '../apiSlice';
import { CATEGORY_URL, GARMENT_URL } from '../constants';
import { parseGarment, type Garment } from '@/api/garmentModels';

export const garmentSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Active garments of an APPAREL category, with their active size × colour variants. */
    getCategoryGarments: builder.query<Garment[], string>({
      query: (categoryId) => ({ url: `${CATEGORY_URL}/${encodeURIComponent(categoryId)}/garments` }),
      transformResponse: (value: unknown) => {
        if (!Array.isArray(value)) throw new Error('The catalog returned an invalid garment list.');
        return value.map(parseGarment);
      },
      providesTags: ['Garment'],
    }),
    getGarmentById: builder.query<Garment, string>({
      query: (id) => ({ url: `${GARMENT_URL}/${encodeURIComponent(id)}` }),
      transformResponse: parseGarment,
      providesTags: ['Garment'],
    }),
  }),
});

export const { useGetCategoryGarmentsQuery, useGetGarmentByIdQuery } = garmentSlice;
