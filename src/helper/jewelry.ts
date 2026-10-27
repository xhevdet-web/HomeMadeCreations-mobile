import type { TFunction } from 'i18next';
import type { CategorySize, DesignItem, JewelryType } from '@/types/models';
import { measuredRingLayout } from '@/helper/design';
import { itemById } from '@/services/catalog';

/**
 * Jewelry (bracelets and necklaces) is sized by real length: a size is a range (e.g.
 * Medium, 18–24 cm), the customer picks an exact length, and each component fills its
 * physical size (an 8 mm bead takes 8 mm). Millimetres are the unit for every calculation;
 * customers read centimetres. The API applies the same rules and is the authority; this
 * keeps the studio in step.
 */

/** Which piece is being made; its texts live under `bracelet.*` or `necklace.*`. */
export type Piece = 'bracelet' | 'necklace';

/** The piece a category makes: a necklace when its shape says so, or (older) its name. */
export function pieceOf(category: { name?: string | null; builderConfig?: { silhouette?: string } | null }): Piece {
  const silhouette = category.builderConfig?.silhouette;
  return (silhouette ? silhouette === 'NECKLACE' : /neck/i.test(category.name ?? '')) ? 'necklace' : 'bracelet';
}

/** Must match the API: a 200 mm piece is complete at 198–202 mm and never passes 202. */
export const JEWELRY_LENGTH_TOLERANCE_MM = 2;
/** Length steps customers adjust by: half a centimetre. */
export const LENGTH_STEP_MM = 5;
/** Must match the API: the lowest price, in cents, a jewelry design can be ordered at. */
export const MIN_JEWELRY_PRICE_CENTS = 500;
/** A typical bead, used where the studio needs an average piece size for its drawing. */
export const TYPICAL_PIECE_MM = 8;

export type MeasuredSize = CategorySize & {
  minMeasurementMm: number;
  maxMeasurementMm: number;
  defaultMeasurementMm: number;
};

const whole = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

/** A size given as a length range, rather than a legacy component count. */
export function isMeasuredSize(size?: CategorySize | null): size is MeasuredSize {
  return !!size && whole(size.minMeasurementMm) && whole(size.maxMeasurementMm)
    && whole(size.defaultMeasurementMm) && size.maxMeasurementMm > size.minMeasurementMm;
}

/** The exact length chosen for a measured size, or null. */
export const selectedLengthMm = (size?: CategorySize | null) =>
  isMeasuredSize(size) && whole(size.selectedMeasurementMm) ? size.selectedMeasurementMm : null;

/** 200 → "20", 165 → "16.5", 168 → "16.8": centimetres without a trailing ".0". */
export const cm = (mm: number) => String(Math.round(mm) / 10);

/** Keeps a length inside its size's range, on the half-centimetre steps customers use. */
export function clampLength(size: MeasuredSize, mm: number) {
  return Math.min(size.maxMeasurementMm, Math.max(size.minMeasurementMm, Math.round(mm)));
}

/** The physical size of a catalog component in mm, or null when it is not configured. */
export const lengthOf = (itemId: string) => {
  const length = itemById[itemId]?.lengthMm;
  return whole(length) ? length : null;
};

/** Total length of the placed pieces; unmeasured pieces cannot be placed on a measured size. */
export const usedLengthMm = (items: DesignItem[], excludingId?: string | null) =>
  items.reduce((sum, entry) => (entry.id === excludingId ? sum : sum + (lengthOf(entry.itemId) ?? 0)), 0);

/** Whether one more piece of `pieceMm` still fits the chosen length. */
export const canFit = (usedMm: number, pieceMm: number, selectedMm: number) =>
  usedMm + pieceMm <= selectedMm + JEWELRY_LENGTH_TOLERANCE_MM;

export const isComplete = (usedMm: number, selectedMm: number) =>
  Math.abs(usedMm - selectedMm) <= JEWELRY_LENGTH_TOLERANCE_MM;

/**
 * "Medium · 20 cm" for a piece made to an exact length, "Medium · 18–24 cm" for a size
 * range, or "Medium · 18 24cm" as legacy sizes stored it.
 */
export function sizeLabel(size?: Partial<CategorySize> | null) {
  if (!size?.name) return '';
  const length = selectedLengthMm(size as CategorySize);
  if (length) return `${size.name} · ${cm(length)} cm`;
  if (isMeasuredSize(size as CategorySize))
    return `${size.name} · ${cm(size.minMeasurementMm!)}–${cm(size.maxMeasurementMm!)} cm`;
  return size.measurement ? `${size.name} · ${size.measurement} ${size.unit ?? ''}`.trim() : size.name;
}

/** What a component can't be added for, if anything: physical fit, separate from stock. */
export function fitProblem(t: TFunction, itemId: string, usedMm: number, selectedMm: number | null) {
  if (selectedMm === null) return null;
  const length = lengthOf(itemId);
  if (length === null) return t('jewelry.notAvailable');
  if (!canFit(usedMm, length, selectedMm))
    return t('jewelry.noRoom', { remaining: Math.max(selectedMm - usedMm, 0) });
  return null;
}

/**
 * True-scale layout of a bracelet or necklace sized by length, in strand order. Pieces
 * without a size (only possible on older designs) are drawn as a typical bead so nothing
 * disappears.
 */
export const lengthLayout = (items: Pick<DesignItem, 'itemId'>[], type: JewelryType, selectedMm: number) =>
  measuredRingLayout(items.map((entry) => lengthOf(entry.itemId) ?? TYPICAL_PIECE_MM), type, selectedMm,
    TYPICAL_PIECE_MM);
