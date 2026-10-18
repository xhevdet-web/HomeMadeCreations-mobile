import type { DesignSide, PrintArea } from './builderModels';

/** One sellable size × colour of a garment, with its own stock. */
export interface GarmentVariant {
  id: string;
  size: string;
  colorName: string;
  colorValue: string;
  sku?: string | null;
  stock: number;
  /** Price override in cents; null uses the garment's basePrice. */
  price?: number | null;
  isActive: boolean;
}

/** A blank garment model customers design on, e.g. "Classic Hoodie". */
export interface Garment {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  /** Product photo shown to customers. */
  imageUrl?: string | null;
  /** Studio mockups; the app draws a tinted silhouette when they are missing. */
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  frontPrintArea?: PrintArea | null;
  backPrintArea?: PrintArea | null;
  /** App-drawn fallback, e.g. HOODIE or TSHIRT. */
  silhouette?: string | null;
  variants: GarmentVariant[];
}

/** The garment snapshot returned with a customer design or an order. */
export type ProductGarmentVariant = Omit<GarmentVariant, 'stock' | 'isActive'> & {
  stock?: number;
  isActive?: boolean;
  garment: Omit<Garment, 'categoryId' | 'variants' | 'basePrice'> & { basePrice?: number };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const fraction = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export function parsePrintArea(value: unknown): PrintArea | null {
  if (!isObject(value) || ![value.x, value.y, value.width, value.height].every(fraction)) return null;
  const area = value as unknown as PrintArea;
  return area.width > 0 && area.height > 0 ? { x: area.x, y: area.y, width: area.width, height: area.height } : null;
}

function parseVariant(value: unknown): GarmentVariant | null {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.size !== 'string' ||
      typeof value.colorName !== 'string' || typeof value.colorValue !== 'string' ||
      !Number.isSafeInteger(value.stock)) return null;
  return {
    id: value.id,
    size: value.size,
    colorName: value.colorName,
    colorValue: value.colorValue,
    sku: typeof value.sku === 'string' ? value.sku : null,
    stock: value.stock as number,
    price: Number.isSafeInteger(value.price) ? (value.price as number) : null,
    isActive: value.isActive !== false,
  };
}

export function parseGarment(value: unknown): Garment {
  const item = value as Record<string, unknown> | null;
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' ||
      typeof item.categoryId !== 'string' || !Number.isSafeInteger(item.basePrice))
    throw new Error('The catalog returned an invalid garment. Please retry.');
  const url = (key: string) => (typeof item[key] === 'string' ? (item[key] as string) : null);
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: typeof item.description === 'string' ? item.description : null,
    basePrice: item.basePrice as number,
    imageUrl: url('imageUrl'),
    frontImageUrl: url('frontImageUrl'),
    backImageUrl: url('backImageUrl'),
    frontPrintArea: parsePrintArea(item.frontPrintArea),
    backPrintArea: parsePrintArea(item.backPrintArea),
    silhouette: typeof item.silhouette === 'string' ? item.silhouette : null,
    variants: (Array.isArray(item.variants) ? item.variants : [])
      .map(parseVariant)
      .filter((variant): variant is GarmentVariant => !!variant),
  };
}

/** Price of a variant: its override, else the garment's basePrice. */
export const variantPrice = (garment: Pick<Garment, 'basePrice'>, variant?: Pick<GarmentVariant, 'price'> | null) =>
  variant?.price ?? garment.basePrice;

export const mockupFor = (garment: Pick<Garment, 'frontImageUrl' | 'backImageUrl'>, side: DesignSide) =>
  // Without a separate back mockup the back reuses the front one, as in the admin dashboard.
  side === 'FRONT' ? garment.frontImageUrl : garment.backImageUrl ?? garment.frontImageUrl;
