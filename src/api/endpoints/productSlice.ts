import { File } from 'expo-file-system';
import i18n from '@/i18n';
import { fetch } from 'expo/fetch';
import { apiSlice, ApiError } from '../apiSlice';
import { PRODUCT_URL, USER_URL } from '../constants';
import { parseProduct } from '@/api/catalogModels';
import type { CommunityCreation, ProductInput, ProductOrigin, SavedProduct } from '@/api/commerceModels';
import { useCatalogStore } from '@/store/catalogStore';

async function appendPreview(data: FormData, field: string, previewUri: string, name?: string) {
  // Data URIs (web) and stored URLs (re-saving an edited design) are sent as blobs,
  // named after their real type (bouquet and gift previews are JPEG).
  if (previewUri.startsWith('data:') || /^https?:\/\//i.test(previewUri)) {
    const blob = await (await fetch(previewUri)).blob();
    data.append(field, blob, name ?? field + (blob.type === 'image/jpeg' ? '.jpg' : '.png'));
    return;
  }
  const preview = new File(previewUri.startsWith('/') ? 'file://' + previewUri : previewUri);
  if (!preview.exists || !preview.size)
    throw new ApiError(i18n.t('studioMessages.previewMissing'), 400);
  data.append(field, preview);
}

/** Multipart body for a new design; the back preview is only sent for two-sided designs. */
export async function productFormData(input: ProductInput, previewUri: string | undefined,
  backPreviewUri?: string, customDesignUris: string[] = []): Promise<FormData> {
  const data = new FormData();
  data.append('categoryId', input.categoryId);
  data.append('name', input.name);
  if (input.selectedSizeId) data.append('selectedSizeId', input.selectedSizeId);
  if (input.selectedMeasurementMm) data.append('selectedMeasurementMm', String(input.selectedMeasurementMm));
  if (input.baseProductId) data.append('baseProductId', input.baseProductId);
  if (input.giftPackagingId) data.append('giftPackagingId', input.giftPackagingId);
  if (input.giftPackagingColorId) data.append('giftPackagingColorId', input.giftPackagingColorId);
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

/** GET /products filters: the API filters by category and origin, never the client. */
export interface ProductQuery {
  categoryId?: string;
  origin?: ProductOrigin;
  search?: string;
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
    /** Active products, e.g. a category's company catalog: { categoryId, origin: 'COMPANY' }. */
    getProducts: builder.query<SavedProduct[], ProductQuery>({
      query: ({ categoryId, origin, search }) => ({
        url: PRODUCT_URL,
        params: { categoryId, origin, search: search?.trim() || undefined, isActive: 'true' },
      }),
      transformResponse: (value: unknown) => {
        if (!Array.isArray(value)) throw new Error('The catalog returned an invalid product list.');
        return value.map(parseProduct);
      },
      providesTags: ['Product'],
    }),
    getUserProducts: builder.query<SavedProduct[], string>({
      query: (userId) => ({ url: `${USER_URL}/${encodeURIComponent(userId)}/products`, auth: true }),
      providesTags: ['Product'],
    }),
    /** Other customers' completed designs; one category's with { categoryId }. */
    getCreationsFromOthers: builder.query<CommunityCreation[], { categoryId?: string } | void>({
      query: (args) => ({
        url: `${PRODUCT_URL}/creations/from-others`,
        auth: true,
        params: { categoryId: args?.categoryId },
      }),
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

export const { useGetAllProductsQuery, useGetProductByIdQuery, useGetOwnedProductByIdQuery, useLazyGetOwnedProductByIdQuery, useGetCanvasProductByIdQuery, useGetProductsQuery, useGetUserProductsQuery, useGetCreationsFromOthersQuery, useCreateProductMutation } = productSlice;
