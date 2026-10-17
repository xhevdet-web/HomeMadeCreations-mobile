import type { CatalogComponent } from './catalogModels';
import type { CategorySize } from '@/types/models';

export interface SavedProduct {
  selectedSize?: CategorySize | null;
  productType?: string;
  stock?: number;
  color?: string | null;
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
  'id' | 'name' | 'description' | 'imageUrl' | 'designPreviewUrl' | 'price' | 'itemCount' | 'items' | 'productType'
>;
export const orderStages = [
  'ORDERED', 'CREATING', 'CREATED', 'READY_FOR_COURIER', 'PICKED_UP_BY_COURIER', 'COMPLETED',
] as const;
export const orderStatusLabels: Record<string, string> = {
  ORDERED: 'Ordered',
  CREATING: 'Being made',
  CREATED: 'Created',
  READY_FOR_COURIER: 'Ready for courier',
  PICKED_UP_BY_COURIER: 'With courier',
  COMPLETED: 'Completed',
};
export const orderStatusLabel = (status: string) =>
  orderStatusLabels[status] ?? status.replaceAll('_', ' ').toLowerCase();
export const paymentLabel = (paymentType: string) =>
  paymentType === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : paymentType.replaceAll('_', ' ').toLowerCase();
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
export interface ProductInput {
  selectedSizeId?: string;
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
