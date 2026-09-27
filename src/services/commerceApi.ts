import { authStorage } from './authStorage';
import { parseTokens, parseUser } from './authApi';
import { CatalogComponent } from './catalogApi';
import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';

export interface SavedProduct {
  imageUrl?: string | null;
  designPreviewUrl?: string | null;
  imageKey?: string | null;
  isActive?: boolean;
  id: string;
  createdById: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  itemCount: number;
  category: { id: string; name: string };
  items: {
    id: string;
    subCategoryId: string;
    quantity: number;
    position: number | null;
    unitPrice: number;
    subCategory: Partial<CatalogComponent> & { name: string };
  }[];
}
export type OrderedProduct = Pick<
  SavedProduct,
  'id' | 'name' | 'description' | 'imageUrl' | 'designPreviewUrl' | 'price' | 'itemCount' | 'items'
>;
export const orderStages = [
  'ORDERED',
  'CREATING',
  'CREATED',
  'READY_FOR_COURIER',
  'PICKED_UP_BY_COURIER',
  'COMPLETED',
] as const;
export interface ApiOrder {
  id: string;
  userId: string;
  productId: string;
  orderNumber: string;
  status: string;
  paymentType: string;
  paymentStatus: string;
  totalPrice: number;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  address: string;
  postalCode?: string;
  customerNotes?: string;
  createdAt: string;
  product: OrderedProduct;
}
export interface OrderPage {
  data: ApiOrder[];
  meta: { page: number; totalPages: number; total: number };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!base) throw new ApiError('API URL is not configured.', 400);
  const raw = await authStorage.read();
  if (!raw) throw new ApiError('Please sign in to continue.', 401);
  let tokens;
  try {
    tokens = parseTokens(JSON.parse(raw));
  } catch {
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) cancel();
  // Image uploads also wait for backend storage, which has its own 15s deadline.
  const timer = setTimeout(cancel, body instanceof FormData ? 45000 : 15000);
  try {
    const response = await fetch(base + path, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: 'Bearer ' + tokens.accessToken,
      },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        response.ok
          ? 'The server returned an invalid response. Check My Designs before saving again.'
          : `The server could not complete the request (HTTP ${response.status}). Please try again later.`,
        response.status,
      );
    }
    if (!response.ok) {
      const message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
      throw new ApiError(
        typeof message === 'string' ? message : 'The request could not be completed.',
        response.status,
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      controller.signal.aborted
        ? 'The request timed out.'
        : 'Could not confirm the server response. Check your connection.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
export interface ProductInput {
  categoryId: string;
  name: string;
  description?: string;
  items: { subCategoryId: string; quantity: number; position: number }[];
}
export interface DeliveryInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  address?: string;
  postalCode?: string | null;
}
export const commerceApi = {
  save: (input: ProductInput, previewUri: string) => {
    const data = new FormData();
    data.append('categoryId', input.categoryId);
    data.append('name', input.name);
    if (input.description) data.append('description', input.description);
    data.append('items', JSON.stringify(input.items));
    if (previewUri.startsWith('data:')) {
      // Expo web capture returns a data URI; browsers require an actual Blob.
      return fetch(previewUri).then((response) => response.blob()).then((blob) => {
        data.append('designPreview', blob, 'design-preview.png');
        return request<SavedProduct>('/products', 'POST', data);
      });
    }
    // SDK 57's Expo fetch rejects React Native's legacy { uri, name, type } parts.
    // File implements the byte-reading interface its multipart encoder supports.
    const preview = new File(previewUri.startsWith('/') ? 'file://' + previewUri : previewUri);
    if (!preview.exists || !preview.size)
      throw new ApiError('The preview file is unavailable. Your design is safe; please capture it again.', 400);
    data.append('designPreview', preview);
    return request<SavedProduct>('/products', 'POST', data);
  },
  products: (userId: string, signal?: AbortSignal) =>
    request<SavedProduct[]>(
      '/users/' + encodeURIComponent(userId) + '/products',
      'GET',
      undefined,
      signal,
    ),
  product: (id: string, signal?: AbortSignal) =>
    request<SavedProduct>('/products/' + encodeURIComponent(id), 'GET', undefined, signal),
  updateProfile: async (input: DeliveryInput) =>
    parseUser(await request('/users/me', 'PATCH', input)),
  order: (productId: string, notes: string) =>
    request<ApiOrder>('/orders', 'POST', {
      productId,
      paymentType: 'CASH_ON_DELIVERY',
      ...(notes.trim() ? { customerNotes: notes.trim() } : {}),
    }),
  orders: (page = 1, signal?: AbortSignal) =>
    request<OrderPage>('/orders?page=' + page + '&limit=20', 'GET', undefined, signal),
  orderDetails: (id: string, signal?: AbortSignal) =>
    request<ApiOrder>('/orders/' + encodeURIComponent(id), 'GET', undefined, signal),
};
