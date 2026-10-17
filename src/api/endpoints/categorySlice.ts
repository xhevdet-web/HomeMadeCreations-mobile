import { apiSlice } from '../apiSlice';
import { CATEGORY_URL } from '../constants';
import { activeList, parseCategory, type CatalogCategory } from '@/api/catalogModels';

export const categorySlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query<CatalogCategory[], void>({
      query: () => ({ url: CATEGORY_URL }),
      transformResponse: (value: unknown) => activeList(value, parseCategory),
      providesTags: ['Category'],
    }),
    getCategoryById: builder.query<CatalogCategory, string>({
      query: (id) => ({ url: `${CATEGORY_URL}/${encodeURIComponent(id)}` }),
      transformResponse: parseCategory,
      providesTags: ['Category'],
    }),
  }),
});

export const { useGetAllCategoriesQuery, useGetCategoryByIdQuery } = categorySlice;
