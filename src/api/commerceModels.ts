import type { CatalogComponent } from './catalogModels';
import type { CategorySize } from '@/types/models';
import type { DesignSide, SelectedOptions, TextLayer } from './builderModels';
import type { ProductGarmentVariant } from './garmentModels';

export interface SavedProduct {
  selectedSize?: CategorySize | null;
  productType?: string;
  stock?: number;
  color?: string | null;
  imageUrl?: string | null;
  designPreviewUrl?: string | null;
  /** Back preview for two-sided designs (APPAREL). */
  backDesignPreviewUrl?: string | null;
  /** The garment size × colour an APPAREL design is printed on. */
  garmentVariant?: ProductGarmentVariant | null;
  /** Options stored by the backend; colours come back as { name, value }. */
  selectedOptions?: Record<string, unknown> | null;
  /** Personalised text of a GIFT design (raw; read with parseTextLayers). */
  textLayers?: unknown;
  basePrice?: number;
  imageKey?: string | null;
  isActive?: boolean;
  id: string;
  createdById: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  itemCount: number;
  category: { id: string; name: string; builderType?: string | null; options?: unknown };
  items: {
    id: string;
    subCategoryId: string;
    quantity: number;
    position: number | null;
    unitPrice: number;
    /** Customer artwork of a CUSTOM_UPLOAD item. */
    customImageUrl?: string | null;
    side?: DesignSide | null;
    x?: number | null;
    y?: number | null;
    scale?: number | null;
    rotation?: number | null;
    subCategory: Partial<CatalogComponent> & { name: string };
  }[];
}
export type OrderedProduct = Pick<
  SavedProduct,
  | 'id' | 'name' | 'description' | 'imageUrl' | 'designPreviewUrl' | 'price' | 'itemCount' | 'items'
  | 'productType' | 'backDesignPreviewUrl' | 'selectedOptions' | 'category' | 'basePrice'
  | 'garmentVariant' | 'textLayers'
>;
// A finished piece by another customer, shown for inspiration. The backend excludes the
// current user's products and ready-made products, and never exposes customer details.
export interface CommunityCreation {
  /** Stable list key only; never shown to the user. */
  completedOrderId: string;
  completedOrderUpdatedAt: string;
  product: Pick<
    SavedProduct,
    | 'id' | 'name' | 'description' | 'imageUrl' | 'designPreviewUrl' | 'price' | 'itemCount'
    | 'items' | 'categoryId' | 'selectedSize' | 'selectedOptions' | 'garmentVariant'
  > & {
    category?: SavedProduct['category'];
    createdBy: { id: string; firstName: string; lastName: string; userName?: string | null };
  };
}
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
  garmentVariantId?: string;
  selectedOptions?: SelectedOptions;
  /** GIFT only: personalised text, positioned on the canvas like the items. */
  textLayers?: TextLayer[];
  categoryId: string;
  name: string;
  description?: string;
  items: {
    subCategoryId: string;
    quantity: number;
    position: number;
    side?: DesignSide;
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    /** Index into the uploaded `customDesigns` files. */
    customDesignIndex?: number;
  }[];
}
export interface DeliveryInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  address?: string;
  postalCode?: string | null;
}
