import type { SavedProduct } from './commerceModels';
import type { CategorySize } from '@/types/models';
export interface CatalogCategory {
  sizes?: CategorySize[] | null;
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  isActive: boolean;
  sortOrder: number;
}
export interface CatalogComponent extends CatalogCategory {
  categoryId: string;
  color: string | null;
  type: string | null;
  price: number;
  stock: number;
  category?: { id: string; name: string };
}
export function parseCategory(value: unknown): CatalogCategory {
  const item = value as CatalogCategory | null;
  if (
    !item ||
    typeof item.id !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.isActive !== 'boolean' ||
    !Number.isFinite(item.sortOrder)
  )
    throw new Error('The catalog returned an invalid category. Please retry.');
  return {
    ...item,
    sizes: item.sizes == null ? [] : parseCategorySizes(item.sizes),
    description: typeof item.description === 'string' ? item.description : null,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
  };
}
export function parseCategorySize(value: unknown): CategorySize {
  const size = value as CategorySize | null;
  if (!size || typeof size.id !== 'string' || !size.id.trim() ||
      typeof size.name !== 'string' || !size.name.trim() ||
      !Number.isFinite(size.measurement) || size.measurement <= 0 ||
      typeof size.unit !== 'string' || !size.unit.trim() ||
      !Number.isSafeInteger(size.maxItems) || size.maxItems <= 0)
    throw new Error('The server returned an invalid size configuration. Please retry.');
  return { id: size.id, name: size.name, measurement: size.measurement,
    unit: size.unit, maxItems: size.maxItems };
}
function parseCategorySizes(value: unknown): CategorySize[] {
  if (!Array.isArray(value)) throw new Error('The server returned invalid category sizes. Please retry.');
  const sizes = value.map(parseCategorySize);
  if (new Set(sizes.map(size => size.id)).size !== sizes.length)
    throw new Error('The server returned duplicate size IDs. Please retry.');
  return sizes;
}
export function parseComponent(value: unknown): CatalogComponent {
  const item = { ...(value as CatalogComponent), ...parseCategory(value) };
  if (
    typeof item.categoryId !== 'string' ||
    !Number.isSafeInteger(item.price) ||
    item.price < 0 ||
    !Number.isSafeInteger(item.stock) ||
    item.stock < 0
  )
    throw new Error('The catalog returned an invalid component. Please retry.');
  return {
    ...item,
    color: typeof item.color === 'string' ? item.color : null,
    type: typeof item.type === 'string' ? item.type : null,
  };
}
export function activeList<T extends CatalogCategory>(value: unknown, parse: (entry: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('The catalog returned an invalid list. Please retry.');
  return value
    .map(parse)
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
export function parseProduct(value: unknown): SavedProduct {
  const item = value as SavedProduct | null;
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' ||
      typeof item.categoryId !== 'string' || !Number.isSafeInteger(item.price) || item.price < 0)
    throw new Error('The catalog returned an invalid product. Please retry.');
  return item;
}
export function readyMadeUnavailable(product: SavedProduct): string | null {
  if (product.productType !== 'READY_MADE' || product.isActive !== true)
    return 'This product is unavailable.';
  if (!Number.isSafeInteger(product.stock) || product.stock! < 0)
    return 'Stock is unavailable. The backend must return available stock before ordering.';
  return product.stock === 0 ? 'Out of stock' : null;
}
