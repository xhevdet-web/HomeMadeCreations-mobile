import type { CatalogComponent } from './catalogModels';
import type { TFunction } from 'i18next';
import type { CategorySize } from '@/types/models';
import type { DesignSide, TextLayer } from './builderModels';
import type { PrintAreas, SizeStock } from './apparelModels';

/** COMPANY: the admin catalog. CUSTOMER: a design saved from a Creative Studio. */
export type ProductOrigin = 'COMPANY' | 'CUSTOMER';

/** The company product a customer design is made on, e.g. the hoodie it is printed on. */
export interface BaseProduct {
  id: string;
  name: string;
  price?: number;
  color?: string | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  backImageUrl?: string | null;
  printAreas?: PrintAreas | null;
  sizes?: SizeStock[] | null;
  isActive?: boolean;
  /** Phone case models: the brand and the overlay drawn above the artwork. */
  deviceBrand?: string | null;
  overlayImageUrl?: string | null;
}

export interface SavedProduct {
  origin?: ProductOrigin;
  /** A design's size: a base product size ({ id: 'L', name: 'L' }) or a studio size preset. */
  selectedSize?: (Partial<CategorySize> & { id: string; name: string }) | null;
  /** COMPANY: stock of an unsized product; sized products keep stock per size. */
  stock?: number;
  sizes?: SizeStock[] | null;
  color?: string | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  /** COMPANY apparel: back canvas image. */
  backImageUrl?: string | null;
  printAreas?: PrintAreas | null;
  /** COMPANY phone case models: the brand, catalog order and overlay above the artwork. */
  deviceBrand?: string | null;
  sortOrder?: number;
  overlayImageUrl?: string | null;
  designPreviewUrl?: string | null;
  /** Back preview for two-sided designs (APPAREL). */
  backDesignPreviewUrl?: string | null;
  baseProductId?: string | null;
  baseProduct?: BaseProduct | null;
  /** Personalised text of a GIFT design (raw; read with parseTextLayers). */
  textLayers?: unknown;
  basePrice?: number;
  /** GIFT designs: the packaging and colour chosen, and their price snapshot in cents. */
  giftPackagingId?: string | null;
  giftPackagingColorId?: string | null;
  packagingPrice?: number;
  giftPackaging?: { id: string; name: string; type: string; shape?: string; price?: number;
    imageUrl?: string | null } | null;
  giftPackagingColor?: { id: string; name: string; hex: string; priceAdjustment?: number;
    imageUrl?: string | null } | null;
  imageKey?: string | null;
  isActive?: boolean;
  id: string;
  createdById: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  itemCount: number;
  category: { id: string; name: string; builderType?: string | null; builderConfig?: unknown };
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
  | 'origin' | 'backDesignPreviewUrl' | 'category' | 'basePrice' | 'baseProduct' | 'selectedSize'
  | 'color' | 'colorHex' | 'textLayers' | 'packagingPrice' | 'giftPackaging' | 'giftPackagingColor'
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
    | 'items' | 'categoryId' | 'selectedSize' | 'baseProduct'
  > & {
    category?: SavedProduct['category'];
    createdBy: { id: string; firstName: string; lastName: string; userName?: string | null };
  };
}
export const orderStages = [
  'ORDERED', 'CREATING', 'CREATED', 'READY_FOR_COURIER', 'PICKED_UP_BY_COURIER', 'COMPLETED',
] as const;
export type OrderStage = (typeof orderStages)[number];
export const isOrderStage = (status: string): status is OrderStage => orderStages.includes(status as OrderStage);
/** Customer-friendly status in the current language; an unknown backend value is shown readably. */
export const orderStatusLabel = (t: TFunction, status: string) =>
  isOrderStage(status) ? t(`orderStatus.${status}`) : status.replaceAll('_', ' ').toLowerCase();
export const paymentLabel = (t: TFunction, paymentType: string) =>
  paymentType === 'CASH_ON_DELIVERY' ? t('payment.cashOnDelivery') : paymentType.replaceAll('_', ' ').toLowerCase();
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
  /** A size of the base product, or of the category's studio size presets. */
  selectedSizeId?: string;
  /** Bracelets: the exact length chosen within the size, in mm. */
  selectedMeasurementMm?: number;
  /** The company product the design is made on; required for APPAREL. */
  baseProductId?: string;
  /** GIFT: the chosen packaging and, for closed packaging, its colour. Priced by the backend. */
  giftPackagingId?: string;
  giftPackagingColorId?: string;
  /** Personalised text (gift, bouquet, apparel), positioned like the items; apparel text names its side. */
  textLayers?: (TextLayer & { side?: DesignSide })[];
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
