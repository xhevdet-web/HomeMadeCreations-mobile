import i18n from '@/i18n';

/** TRANSPARENT shows the gift's contents; OPAQUE ("Closed" to customers) keeps it a surprise. */
export type GiftPackagingType = 'TRANSPARENT' | 'OPAQUE';
/** The box drawn in the Gift Studio and the space pieces are arranged in. */
export type GiftPackagingShape = 'SQUARE' | 'RECTANGULAR';

export interface GiftPackagingColor {
  id: string;
  name: string;
  hex: string;
  imageUrl: string | null;
  /** Added to the packaging price, in cents. */
  priceAdjustment: number;
  stock: number;
  isActive: boolean;
  sortOrder: number;
}

/** What a gift arrives in. It surrounds the design; it is never placed on the canvas. */
export interface GiftPackaging {
  id: string;
  name: string;
  description: string | null;
  type: GiftPackagingType;
  shape: GiftPackagingShape;
  imageUrl: string | null;
  /** Cents. */
  price: number;
  /** Stock of packaging without colours; coloured packaging keeps it per colour. */
  stock: number;
  isActive: boolean;
  sortOrder: number;
  colors: GiftPackagingColor[];
}

/**
 * The packaging chosen for a gift, kept with the draft so the studio and preview draw and
 * price it without loading the catalog again. Display only: on save the backend checks
 * the ids against its own catalog and charges its own prices.
 */
export interface PackagingChoice {
  id: string;
  name: string;
  type: GiftPackagingType;
  shape: GiftPackagingShape;
  price: number;
  imageUrl: string | null;
  color: Pick<GiftPackagingColor, 'id' | 'name' | 'hex' | 'priceAdjustment' | 'imageUrl'> | null;
}

const invalid = () => new Error(i18n.t('designErrors.invalidCatalog'));
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;
const image = (value: unknown) => (typeof value === 'string' ? value : null);
const shapeOf = (value: unknown): GiftPackagingShape => (value === 'RECTANGULAR' ? 'RECTANGULAR' : 'SQUARE');
const bySortOrder = <T extends { sortOrder: number; name: string }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

function parseColor(value: unknown): GiftPackagingColor {
  const color = value as GiftPackagingColor | null;
  if (!color || typeof color.id !== 'string' || typeof color.name !== 'string'
    || typeof color.hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color.hex)
    || !count(color.priceAdjustment) || !count(color.stock) || typeof color.isActive !== 'boolean')
    throw invalid();
  return { id: color.id, name: color.name, hex: color.hex, imageUrl: image(color.imageUrl),
    priceAdjustment: color.priceAdjustment, stock: color.stock, isActive: color.isActive,
    sortOrder: Number.isFinite(color.sortOrder) ? color.sortOrder : 0 };
}

export function parsePackaging(value: unknown): GiftPackaging {
  const item = value as GiftPackaging | null;
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string'
    || (item.type !== 'TRANSPARENT' && item.type !== 'OPAQUE')
    || !count(item.price) || !count(item.stock) || typeof item.isActive !== 'boolean'
    || !Array.isArray(item.colors))
    throw invalid();
  return {
    id: item.id, name: item.name, type: item.type, shape: shapeOf(item.shape), price: item.price,
    stock: item.stock, isActive: item.isActive, imageUrl: image(item.imageUrl),
    description: typeof item.description === 'string' && item.description.trim() ? item.description : null,
    sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : 0,
    // Transparency is a type, not a colour: transparent packaging never offers colours.
    colors: item.type === 'OPAQUE' ? item.colors.map(parseColor).sort(bySortOrder) : [],
  };
}

export function parsePackagingList(value: unknown): GiftPackaging[] {
  if (!Array.isArray(value)) throw invalid();
  return value.map(parsePackaging).sort(bySortOrder);
}

/** Closed packaging that comes in colours needs one chosen. */
export const needsColor = (packaging: GiftPackaging) => packaging.type === 'OPAQUE' && packaging.colors.length > 0;

export const colorAvailable = (color: GiftPackagingColor) => color.isActive && color.stock > 0;

/** Whether new gifts can use it: active, and in stock (in at least one colour when coloured). */
export function packagingAvailable(packaging: GiftPackaging) {
  if (!packaging.isActive) return false;
  return needsColor(packaging) ? packaging.colors.some(colorAvailable) : packaging.stock > 0;
}

export function choiceOf(packaging: GiftPackaging, color: GiftPackagingColor | null): PackagingChoice {
  return {
    id: packaging.id, name: packaging.name, type: packaging.type, shape: packaging.shape,
    price: packaging.price, imageUrl: packaging.imageUrl,
    color: color && { id: color.id, name: color.name, hex: color.hex, priceAdjustment: color.priceAdjustment,
      imageUrl: color.imageUrl },
  };
}

/** A saved gift's packaging, as the product response returns it. */
export function savedChoice(packaging: unknown, color: unknown): PackagingChoice | null {
  const saved = packaging as Partial<GiftPackaging> | null | undefined;
  if (!saved || typeof saved.id !== 'string' || typeof saved.name !== 'string'
    || (saved.type !== 'TRANSPARENT' && saved.type !== 'OPAQUE')) return null;
  const savedColor = color as Partial<GiftPackagingColor> | null | undefined;
  return {
    id: saved.id, name: saved.name, type: saved.type, shape: shapeOf(saved.shape),
    price: count(saved.price) ? saved.price! : 0, imageUrl: image(saved.imageUrl),
    color: savedColor && typeof savedColor.id === 'string' && typeof savedColor.name === 'string'
      && typeof savedColor.hex === 'string'
      ? { id: savedColor.id, name: savedColor.name, hex: savedColor.hex, imageUrl: image(savedColor.imageUrl),
        priceAdjustment: count(savedColor.priceAdjustment) ? savedColor.priceAdjustment! : 0 }
      : null,
  };
}

/** Estimated packaging price in cents; the backend charges its own catalog price on save. */
export const choicePrice = (choice: PackagingChoice | null) =>
  (choice?.price ?? 0) + (choice?.color?.priceAdjustment ?? 0);

/** Closed packaging turns the drawn gift bag into a gift box in its colour and shape. */
export const sceneWrap = (choice: PackagingChoice | null) =>
  choice?.type === 'OPAQUE' ? { hex: choice.color?.hex ?? null, shape: choice.shape } : null;
