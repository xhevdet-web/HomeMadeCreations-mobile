import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { apiSlice, ApiError } from '../apiSlice';
import { PRODUCT_URL, USER_URL } from '../constants';
import { parseProduct } from '@/api/catalogModels';
import type { CommunityCreation, ProductInput, SavedProduct } from '@/api/commerceModels';
import { useCatalogStore } from '@/store/catalogStore';

export async function productFormData(input: ProductInput, previewUri: string): Promise<FormData> {
  const data = new FormData();
  data.append('categoryId', input.categoryId);
  data.append('name', input.name);
  if (input.selectedSizeId) data.append('selectedSizeId', input.selectedSizeId);
  if (input.description) data.append('description', input.description);
  data.append('items', JSON.stringify(input.items));
  if (previewUri.startsWith('data:')) {
    data.append('designPreview', await (await fetch(previewUri)).blob(), 'design-preview.png');
  } else {
    const preview = new File(previewUri.startsWith('/') ? 'file://' + previewUri : previewUri);
    if (!preview.exists || !preview.size)
      throw new ApiError('The preview file is unavailable. Your design is safe; please capture it again.', 400);
    data.append('designPreview', preview);
  }
  return data;
}

function registerProduct(saved: SavedProduct) {
  // Existing canvas metadata remains in the local catalog registry.
  return useCatalogStore.getState().registerSavedProduct(saved);
}

export const productSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query<ReturnType<typeof registerProduct>[], void>({
      query: () => ({ url: PRODUCT_URL }),
      transformResponse: (value: unknown) => {
        if (!Array.isArray(value)) throw new Error('The catalog returned an invalid product list.');
        return value.map(parseProduct).filter((product) => product.isActive !== false).map(registerProduct);
      },
      providesTags: ['Product'],
    }),
    getProductById: builder.query<SavedProduct, string>({
      query: (id) => ({ url: `${PRODUCT_URL}/${encodeURIComponent(id)}` }),
      transformResponse: parseProduct,
      providesTags: ['Product'],
    }),
    getOwnedProductById: builder.query<SavedProduct, string>({
      query: (id) => ({ url: `${PRODUCT_URL}/${encodeURIComponent(id)}`, auth: true }),
      transformResponse: parseProduct,
      providesTags: ['Product'],
    }),
    getCanvasProductById: builder.query<ReturnType<typeof registerProduct>, string>({
      query: (id) => ({ url: `${PRODUCT_URL}/${encodeURIComponent(id)}` }),
      transformResponse: (value: unknown) => registerProduct(parseProduct(value)),
      providesTags: ['Product'],
    }),
    getReadyMadeProducts: builder.query<SavedProduct[], void>({
      query: () => ({ url: PRODUCT_URL }),
      transformResponse: (value: unknown) => {
        if (!Array.isArray(value)) throw new Error('The catalog returned an invalid product list.');
        return value.map(parseProduct).filter((product) => product.isActive === true && product.productType === 'READY_MADE');
      },
      providesTags: ['Product'],
    }),
    getUserProducts: builder.query<SavedProduct[], string>({
      query: (userId) => ({ url: `${USER_URL}/${encodeURIComponent(userId)}/products`, auth: true }),
      providesTags: ['Product'],
    }),
    getCreationsFromOthers: builder.query<CommunityCreation[], void>({
      query: () => ({ url: `${PRODUCT_URL}/creations/from-others`, auth: true }),
      transformResponse: (value: { data?: unknown } | null) => {
        if (!Array.isArray(value?.data)) throw new Error('The server returned an invalid creations list.');
        return value.data as CommunityCreation[];
      },
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation<SavedProduct, FormData>({
      query: (body) => ({ url: PRODUCT_URL, method: 'POST', body, auth: true }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const { useGetAllProductsQuery, useGetProductByIdQuery, useGetOwnedProductByIdQuery, useLazyGetOwnedProductByIdQuery, useGetCanvasProductByIdQuery, useGetReadyMadeProductsQuery, useGetUserProductsQuery, useGetCreationsFromOthersQuery, useCreateProductMutation } = productSlice;
