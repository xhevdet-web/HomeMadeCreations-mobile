import { authStorage } from './authStorage';
import { parseTokens, parseUser } from './authApi';
import { CatalogComponent } from './catalogApi';

export interface SavedProduct {
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
  product: SavedProduct;
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
  const timer = setTimeout(cancel, 15000);
  try {
    const response = await fetch(base + path, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokens.accessToken,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
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
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  address: string;
  postalCode?: string;
}
export const commerceApi = {
  save: (input: ProductInput) => request<SavedProduct>('/products', 'POST', input),
  products: (userId: string, signal?: AbortSignal) =>
    request<SavedProduct[]>(
      '/users/' + encodeURIComponent(userId) + '/products',
      'GET',
      undefined,
      signal,
    ),
  product: (id: string, signal?: AbortSignal) =>
    request<SavedProduct>('/products/' + encodeURIComponent(id), 'GET', undefined, signal),
  updateProfile: async (userId: string, input: DeliveryInput) =>
    parseUser(await request('/users/' + encodeURIComponent(userId), 'PATCH', input)),
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
