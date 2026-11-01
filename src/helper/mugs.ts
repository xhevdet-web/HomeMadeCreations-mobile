import type { CaseTransform } from '@/helper/caseStudio';

/**
 * Mugs. The company prints one standard white mug: the blank COMPANY product of the Mugs
 * category whose front print area gives the real print size and safe margins in mm (set
 * in the dashboard). A customer mug is ONE design: a single image (MAX_MUG_ELEMENTS; the
 * studio supports more if this is raised, as the API does). The image is placed by its
 * centre (x/y, 0–1 of the print area), a scale and a rotation, saved on its ProductItem.
 */
export const MUG_BUILDER = 'MUG';
export const MAX_MUG_ELEMENTS: number = 1;
export const MAX_MUGS_PER_ORDER = 100;

/** At scale 1 an image is this share of the print height (its width follows its shape). */
const BASE_HEIGHT_SHARE = 0.6;
export const MIN_ELEMENT_SCALE = 0.2;
export const MAX_ELEMENT_SCALE = 4;
/** About 150 dpi. Only warns about images that will clearly look soft. */
const MIN_PIXELS_PER_MM = 6;

/**
 * Visual approximation for the mug preview only, never for production: the print covers
 * this share of the mug's circumference (the rest is the gap at the handle), and this
 * share of the body's height.
 */
export const PREVIEW_PRINT_SHARE_OF_CIRCUMFERENCE = 0.8;
export const PREVIEW_PRINT_SHARE_OF_HEIGHT = 0.82;

export interface MugPrintArea {
  widthMm: number;
  heightMm: number;
  safeMm: { top: number; right: number; bottom: number; left: number };
}

const mm = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

/** The print area of a mug product, when it is the blank mug; else null. */
export function mugPrintArea(product: { printAreas?: unknown } | null | undefined): MugPrintArea | null {
  const front = (product?.printAreas as { front?: Record<string, unknown> } | null | undefined)?.front;
  if (!front || !mm(front.widthMm) || !mm(front.heightMm) || !front.widthMm || !front.heightMm) return null;
  const safe = (front.safeMm ?? {}) as Record<string, unknown>;
  const margin = (key: string) => (mm(safe[key]) ? safe[key] as number : 0);
  return {
    widthMm: front.widthMm,
    heightMm: front.heightMm,
    safeMm: { top: margin('top'), right: margin('right'), bottom: margin('bottom'), left: margin('left') },
  };
}

export const isMugProduct = (product: { category?: { builderType?: string | null } | null }) =>
  product.category?.builderType === MUG_BUILDER;

/** Height ÷ width of the print area. */
export const printAspect = (area: MugPrintArea) => area.heightMm / area.widthMm;

/** An image's box on a print canvas `width` points wide, before rotation. */
export function elementBox(area: MugPrintArea, width: number, scale: number,
  image?: { width: number; height: number } | null) {
  const height = width * printAspect(area) * BASE_HEIGHT_SHARE * scale;
  const ratio = image?.width && image.height ? image.width / image.height : 1;
  return { width: height * ratio, height };
}

const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * Keeps an image's centre on the print area (it may hang over the edge, where it is cut
 * off), its scale usable and its rotation within ±180°.
 */
export function clampElement(next: CaseTransform): CaseTransform {
  const rotation = ((((next.rotation + 180) % 360) + 360) % 360) - 180;
  return {
    x: round(Math.min(Math.max(next.x, 0), 1)),
    y: round(Math.min(Math.max(next.y, 0), 1)),
    scale: round(Math.min(Math.max(next.scale, MIN_ELEMENT_SCALE), MAX_ELEMENT_SCALE)),
    rotation: Math.round(rotation * 10) / 10,
  };
}

/** The dashed safe area as fractions of the print area (left/top/right/bottom edges). */
export function safeBounds(area: MugPrintArea) {
  const { top, right, bottom, left } = area.safeMm;
  return {
    left: left / area.widthMm, right: 1 - right / area.widthMm,
    top: top / area.heightMm, bottom: 1 - bottom / area.heightMm,
  };
}

/**
 * Keeps the whole image, rotated, inside the dashed safe area: as large as the area
 * allows and no further, nearest to where it was placed. Everything printed is in it.
 */
export function fitInside(next: CaseTransform, area: MugPrintArea, image?: { width: number; height: number } | null) {
  const free = clampElement(next);
  const heightMm = area.heightMm * BASE_HEIGHT_SHARE;
  const widthMm = heightMm * (image?.width && image.height ? image.width / image.height : 1);
  const radians = (free.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  // Footprint of the rotated image at scale 1, in mm.
  const spanX = widthMm * cos + heightMm * sin;
  const spanY = widthMm * sin + heightMm * cos;
  const safe = safeBounds(area);
  const safeWidth = (safe.right - safe.left) * area.widthMm;
  const safeHeight = (safe.bottom - safe.top) * area.heightMm;
  const fit = Math.min(safeWidth / spanX, safeHeight / spanY);
  const scale = round(Math.min(Math.max(free.scale, Math.min(MIN_ELEMENT_SCALE, fit)), Math.min(MAX_ELEMENT_SCALE, fit)));
  const halfX = (spanX * scale) / 2 / area.widthMm;
  const halfY = (spanY * scale) / 2 / area.heightMm;
  return {
    ...free,
    scale,
    x: round(Math.min(Math.max(free.x, safe.left + halfX), safe.right - halfX)),
    y: round(Math.min(Math.max(free.y, safe.top + halfY), safe.bottom - halfY)),
  };
}

/**
 * A text box's width at scale 1, as a share of the print width: a comfortable line on the
 * side of the mug facing the customer, never wider than the safe area.
 */
export function textBoxShare(area: MugPrintArea) {
  const safeWidth = area.widthMm - area.safeMm.left - area.safeMm.right;
  return Math.min(safeWidth, area.heightMm * 0.9) / area.widthMm;
}

/** Whether an uploaded image has too few pixels for its printed size. */
export function isLowQualityElement(image: { width: number; height: number } | null | undefined,
  area: MugPrintArea, scale: number) {
  if (!image?.width || !image.height) return false;
  const printedHeightMm = area.heightMm * BASE_HEIGHT_SHARE * scale;
  return image.height / printedHeightMm < MIN_PIXELS_PER_MM;
}
