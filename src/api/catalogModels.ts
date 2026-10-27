import i18n from '@/i18n';
import type { TFunction } from 'i18next';
import type { SavedProduct } from './commerceModels';
import type { CategorySize } from '@/types/models';
import { parseBuilderConfig, parseBuilderType, type BuilderConfig, type BuilderType } from './builderModels';
import { isSized, sizeStock } from './apparelModels';
export interface CatalogCategory {
  sizes?: CategorySize[] | null;
  /** Which studio opens this category; null keeps the original jewelry studio. */
  builderType?: BuilderType | null;
  builderConfig?: BuilderConfig | null;
  /** Shared design library this category also offers designs from. */
  designCategoryId?: string | null;
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
  /** false for unlimited printed designs. */
  trackStock?: boolean;
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
    throw new Error(i18n.t('designErrors.invalidCatalog'));
  return {
    ...item,
    sizes: item.sizes == null ? [] : parseCategorySizes(item.sizes),
    description: typeof item.description === 'string' ? item.description : null,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
    builderType: parseBuilderType(item.builderType),
    builderConfig: parseBuilderConfig(item.builderConfig),
    designCategoryId: typeof item.designCategoryId === 'string' ? item.designCategoryId : null,
  };
}
export function parseCategorySize(value: unknown): CategorySize {
  const size = value as CategorySize | null;
  if (!size || typeof size.id !== 'string' || !size.id.trim() ||
      typeof size.name !== 'string' || !size.name.trim() ||
      !Number.isFinite(size.measurement) || size.measurement <= 0 ||
      typeof size.unit !== 'string' || !size.unit.trim() ||
      !Number.isSafeInteger(size.maxItems) || size.maxItems <= 0)
    throw new Error(i18n.t('designErrors.invalidCatalog'));
  return { id: size.id, name: size.name, measurement: size.measurement,
    unit: size.unit, maxItems: size.maxItems };
}
function parseCategorySizes(value: unknown): CategorySize[] {
  if (!Array.isArray(value)) throw new Error(i18n.t('designErrors.invalidCatalog'));
  const sizes = value.map(parseCategorySize);
  if (new Set(sizes.map(size => size.id)).size !== sizes.length)
    throw new Error(i18n.t('designErrors.invalidCatalog'));
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
    throw new Error(i18n.t('designErrors.invalidCatalog'));
  return {
    ...item,
    color: typeof item.color === 'string' ? item.color : null,
    type: typeof item.type === 'string' ? item.type : null,
  };
}
export function activeList<T extends CatalogCategory>(value: unknown, parse: (entry: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error(i18n.t('designErrors.invalidCatalog'));
  return value
    .map(parse)
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
export function parseProduct(value: unknown): SavedProduct {
  const item = value as SavedProduct | null;
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' ||
      typeof item.categoryId !== 'string' || !Number.isSafeInteger(item.price) || item.price < 0)
    throw new Error(i18n.t('designErrors.invalidCatalog'));
  return item;
}
export const isCompanyProduct = (product: Pick<SavedProduct, 'origin'>) => product.origin === 'COMPANY';

/** Why a company product cannot be ordered (in this size), or null when it can. */
export function companyUnavailable(t: TFunction, product: SavedProduct, size?: string | null): string | null {
  if (!isCompanyProduct(product) || product.isActive !== true) return t('availability.unavailable');
  if (isSized(product)) {
    if (!size) return t('availability.chooseSize');
    return sizeStock(product, size) > 0 ? null : t('availability.sizeSoldOut', { size });
  }
  if (!Number.isSafeInteger(product.stock) || product.stock! < 0) return t('availability.stockUnknown');
  return product.stock === 0 ? t('readyMade.outOfStock') : null;
}
