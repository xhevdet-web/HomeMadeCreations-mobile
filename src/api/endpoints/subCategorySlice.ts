import { apiSlice } from '../apiSlice';
import { CATEGORY_URL, SUB_CATEGORY_URL } from '../constants';
import { activeList, parseComponent, type CatalogComponent } from '@/api/catalogModels';

export const subCategorySlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategoryComponents: builder.query<CatalogComponent[], string>({
      query: (id) => ({ url: `${CATEGORY_URL}/${encodeURIComponent(id)}/sub-categories` }),
      transformResponse: (value: unknown) => activeList(value, parseComponent),
      providesTags: ['SubCategory'],
    }),
    getComponentById: builder.query<CatalogComponent, string>({
      query: (id) => ({ url: `${SUB_CATEGORY_URL}/${encodeURIComponent(id)}` }),
      transformResponse: parseComponent,
      providesTags: ['SubCategory'],
    }),
  }),
});

export const { useGetCategoryComponentsQuery, useLazyGetCategoryComponentsQuery, useGetComponentByIdQuery } = subCategorySlice;
