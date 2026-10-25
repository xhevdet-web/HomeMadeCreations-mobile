import type { DesignSide, PrintArea } from './builderModels';

/** One size of a company product with its own stock, e.g. { size: 'M', stock: 28 }. */
export interface SizeStock {
  size: string;
  stock: number;
}

/** Printable areas of a piece, as fractions of its front and back images. */
export interface PrintAreas {
  front?: PrintArea | null;
  back?: PrintArea | null;
}

/**
 * What the Apparel Studio needs to draw the piece a design is made on: the company
 * product's images and print areas, its colour, and the category's drawn silhouette as
 * the fallback when no image is uploaded.
 */
export interface ApparelLook {
  imageUrl?: string | null;
  backImageUrl?: string | null;
  printAreas?: PrintAreas | null;
  colorHex?: string | null;
  silhouette?: string | null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const fraction = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export function parsePrintArea(value: unknown): PrintArea | null {
  if (!isObject(value) || ![value.x, value.y, value.width, value.height].every(fraction)) return null;
  const area = value as unknown as PrintArea;
  return area.width > 0 && area.height > 0 ? { x: area.x, y: area.y, width: area.width, height: area.height } : null;
}

export function parsePrintAreas(value: unknown): PrintAreas | null {
  if (!isObject(value)) return null;
  return { front: parsePrintArea(value.front), back: parsePrintArea(value.back) };
}

/** Sizes of a company product; empty when it is not sold in sizes. */
export function parseSizes(value: unknown): SizeStock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) =>
    isObject(entry) && typeof entry.size === 'string' && Number.isSafeInteger(entry.stock)
      ? [{ size: entry.size, stock: entry.stock as number }]
      : []);
}

export const isSized = (product: { sizes?: unknown }) => parseSizes(product.sizes).length > 0;

/** Stock of one size, 0 when the size is not sold. */
export const sizeStock = (product: { sizes?: unknown }, size: string | null | undefined) =>
  parseSizes(product.sizes).find((entry) => entry.size === size)?.stock ?? 0;

export const inStock = (product: { sizes?: unknown; stock?: number }) =>
  isSized(product)
    ? parseSizes(product.sizes).some((entry) => entry.stock > 0)
    : (product.stock ?? 0) > 0;

export const mockupFor = (look: Pick<ApparelLook, 'imageUrl' | 'backImageUrl'>, side: DesignSide) =>
  // Without a separate back image the back reuses the front one, as in the admin dashboard.
  side === 'FRONT' ? look.imageUrl : look.backImageUrl ?? look.imageUrl;
