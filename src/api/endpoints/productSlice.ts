import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { apiSlice, ApiError } from '../apiSlice';
import { PRODUCT_URL, USER_URL } from '../constants';
import { parseProduct } from '@/api/catalogModels';
import type { CommunityCreation, ProductInput, SavedProduct } from '@/api/commerceModels';
import { useCatalogStore } from '@/store/catalogStore';

async function appendPreview(data: FormData, field: string, previewUri: string, name = field + '.png') {
  // Data URIs (web) and stored URLs (re-saving an edited design) are sent as blobs.
  if (previewUri.startsWith('data:') || /^https?:\/\//i.test(previewUri)) {
    data.append(field, await (await fetch(previewUri)).blob(), name);
    return;
  }
  const preview = new File(previewUri.startsWith('/') ? 'file://' + previewUri : previewUri);
  if (!preview.exists || !preview.size)
    throw new ApiError('The preview file is unavailable. Your design is safe; please capture it again.', 400);
  data.append(field, preview);
}

/** Multipart body for a new design; the back preview is only sent for two-sided designs. */
export async function productFormData(input: ProductInput, previewUri: string | undefined,
  backPreviewUri?: string, customDesignUris: string[] = []): Promise<FormData> {
  const data = new FormData();
  data.append('categoryId', input.categoryId);
  data.append('name', input.name);
  if (input.selectedSizeId) data.append('selectedSizeId', input.selectedSizeId);
  if (input.garmentVariantId) data.append('garmentVariantId', input.garmentVariantId);
  if (input.selectedOptions) data.append('selectedOptions', JSON.stringify(input.selectedOptions));
  if (input.textLayers?.length) data.append('textLayers', JSON.stringify(input.textLayers));
  if (input.description) data.append('description', input.description);
  data.append('items', JSON.stringify(input.items));
  if (previewUri) await appendPreview(data, 'designPreview', previewUri);
  if (backPreviewUri) await appendPreview(data, 'backDesignPreview', backPreviewUri);
  // Customer artwork, in the order referenced by items[].customDesignIndex.
  for (const [index, uri] of customDesignUris.entries())
    await appendPreview(data, 'customDesigns', uri, `custom-design-${index}.png`);
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
