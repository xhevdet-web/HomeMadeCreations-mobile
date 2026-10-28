import type { PrintArea } from './builderModels';
import type { SavedProduct } from './commerceModels';

/** A printable area or camera opening of a case template; radius is a share of its width. */
export interface CaseArea extends PrintArea {
  radius?: number;
}

/**
 * Everything the Case Studio needs to draw one phone model, all set by the admin on the
 * model's COMPANY product: the template (the empty case), an optional overlay drawn above
 * the artwork (edges, camera island), the printable area and the camera opening.
 */
export interface CaseTemplate {
  imageUrl?: string | null;
  overlayImageUrl?: string | null;
  area: CaseArea;
  camera: CaseArea | null;
}

/** A phone model offered in the studio, e.g. Apple · iPhone 14 · €15.00. */
export type CaseModel = SavedProduct;

// Until a model's printable area is configured, artwork fills the whole template.
const FULL_AREA: CaseArea = { x: 0.02, y: 0.01, width: 0.96, height: 0.98, radius: 0.14 };

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const fraction = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export function parseCaseArea(value: unknown): CaseArea | null {
  if (!isObject(value) || ![value.x, value.y, value.width, value.height].every(fraction)) return null;
  const { x, y, width, height } = value as unknown as PrintArea;
  if (width <= 0 || height <= 0) return null;
  const radius = fraction(value.radius) ? Math.min(value.radius, 0.5) : 0;
  return { x, y, width, height, radius };
}

export function caseTemplateOf(
  model: Pick<CaseModel, 'imageUrl' | 'overlayImageUrl' | 'printAreas'> | null | undefined,
): CaseTemplate {
  const areas = model?.printAreas as unknown;
  const raw = isObject(areas) ? areas : {};
  return {
    imageUrl: model?.imageUrl,
    overlayImageUrl: model?.overlayImageUrl,
    area: parseCaseArea(raw.front) ?? FULL_AREA,
    camera: parseCaseArea(raw.camera),
  };
}

// Well-known brands first, in this order; any other brand follows alphabetically.
const BRAND_ORDER = ['APPLE', 'SAMSUNG', 'GOOGLE', 'XIAOMI', 'HUAWEI'];
const BRAND_NAMES: Record<string, string> = {
  APPLE: 'Apple', SAMSUNG: 'Samsung', GOOGLE: 'Google', XIAOMI: 'Xiaomi', HUAWEI: 'Huawei',
};

/** "Apple", "Samsung"; unknown brands are shown capitalised. Brand names are not translated. */
export function brandName(brand: string) {
  return BRAND_NAMES[brand] ?? brand.charAt(0) + brand.slice(1).toLowerCase().replaceAll('_', ' ');
}

/** Active models grouped by brand, each group in the admin's sort order. */
export function modelsByBrand(models: CaseModel[], otherBrand: string) {
  const groups = new Map<string, CaseModel[]>();
  for (const model of models) {
    if (model.isActive === false) continue;
    const brand = model.deviceBrand?.trim() || 'OTHER';
    groups.set(brand, [...(groups.get(brand) ?? []), model]);
  }
  const rank = (brand: string) => {
    const index = BRAND_ORDER.indexOf(brand);
    return index === -1 ? (brand === 'OTHER' ? BRAND_ORDER.length + 1 : BRAND_ORDER.length) : index;
  };
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([brand, entries]) => ({
      brand,
      label: brand === 'OTHER' ? otherBrand : brandName(brand),
      models: entries.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    }));
}
